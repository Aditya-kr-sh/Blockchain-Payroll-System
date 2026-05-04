from flask import Blueprint, jsonify, request, send_file
from models.db import get_db_connection
from utils.auth_utils import get_request_domain
from services.report_service import generate_organization_report
import mysql.connector
import io

analytics_bp = Blueprint('analytics_bp', __name__)

def calculate_growth(current, previous):
    if previous == 0:
        return 100 if current > 0 else 0
    return round(((current - previous) / previous) * 100, 1)

@analytics_bp.route('/dashboard', methods=['GET'])
def get_dashboard_stats():
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # 1. Workforce Growth
        cursor.execute("SELECT COUNT(*) as count FROM employees WHERE status='Active' AND org_domain = %s", (domain,))
        employees_count = cursor.fetchone()['count']
        cursor.execute("SELECT COUNT(*) as count FROM employees WHERE joining_date < DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') AND org_domain = %s", (domain,))
        prev_employees_count = cursor.fetchone()['count']
        workforce_growth = calculate_growth(employees_count, prev_employees_count)

        # 2. Payout Growth
        cursor.execute("""
            SELECT COALESCE(SUM(net_salary), 0) as total_expense 
            FROM payroll 
            WHERE month_year = DATE_FORMAT(CURRENT_DATE, '%Y-%m') AND org_domain = %s
        """, (domain,))
        expense = float(cursor.fetchone()['total_expense'] or 0)
        cursor.execute("""
            SELECT COALESCE(SUM(net_salary), 0) as prev_expense 
            FROM payroll 
            WHERE month_year = DATE_FORMAT(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH), '%Y-%m') AND org_domain = %s
        """, (domain,))
        prev_expense = float(cursor.fetchone()['prev_expense'] or 0)
        payout_growth = calculate_growth(expense, prev_expense)

        # 3. Leave Requests Growth (Requests this month vs last month)
        cursor.execute("SELECT COUNT(*) as count FROM leave_requests WHERE org_domain = %s AND DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(CURRENT_DATE, '%Y-%m')", (domain,))
        this_month_leaves = cursor.fetchone()['count']
        cursor.execute("SELECT COUNT(*) as count FROM leave_requests WHERE org_domain = %s AND DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH), '%Y-%m')", (domain,))
        prev_month_leaves = cursor.fetchone()['count']
        leaves_growth = calculate_growth(this_month_leaves, prev_month_leaves)

        # Basic Stats (Remaining)
        cursor.execute("SELECT department, COUNT(*) as count FROM employees WHERE status='Active' AND org_domain = %s GROUP BY department", (domain,))
        departments = cursor.fetchall()

        cursor.execute("SELECT COUNT(*) as pending_leaves FROM leave_requests WHERE status IN ('Pending', 'Manager Approved', 'HR Approved') AND org_domain = %s", (domain,))
        pending_leaves = cursor.fetchone()['pending_leaves']

        return jsonify({
            "total_employees": employees_count,
            "workforce_growth": workforce_growth,
            "monthly_payroll_expense": expense,
            "payout_growth": payout_growth,
            "department_distribution": departments,
            "pending_leaves": pending_leaves,
            "leaves_growth": leaves_growth
        }), 200
    except Exception as e:
        return jsonify({
            "total_employees": 0, "monthly_payroll_expense": 0,
            "department_distribution": [], "attendance_trends": [], 
            "pending_leaves": 0, "total_payrolls_this_month": 0,
            "error": str(e)
        }), 200 # Still return 200 with error key for frontend resilience
    finally:
        if conn:
            conn.close()

@analytics_bp.route('/payroll-trends', methods=['GET'])
def payroll_trends():
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT month_year, 
                   SUM(net_salary) as total_net,
                   SUM(base_salary) as total_base,
                   SUM(tax_deduction) as total_tax,
                   SUM(bonus) as total_bonus,
                   COUNT(*) as employee_count
            FROM payroll
            WHERE org_domain = %s
            GROUP BY month_year
            ORDER BY month_year ASC
            LIMIT 12
        """, (domain,))
        trends = cursor.fetchall()
        return jsonify(trends), 200
    finally:
        conn.close()

@analytics_bp.route('/department-salary', methods=['GET'])
def department_salary():
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT e.department,
                   AVG(e.base_salary) as avg_salary,
                   SUM(e.base_salary) as total_salary,
                   COUNT(*) as employee_count
            FROM employees e
            WHERE e.status = 'Active' AND e.org_domain = %s
            GROUP BY e.department
        """, (domain,))
        data = cursor.fetchall()
        return jsonify(data), 200
    finally:
        conn.close()

@analytics_bp.route('/attendance-analytics', methods=['GET'])
def attendance_analytics():
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        month = request.args.get('month')

        query = """
            SELECT 
                SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) as total_present,
                SUM(CASE WHEN status='Absent' THEN 1 ELSE 0 END) as total_absent,
                SUM(CASE WHEN status='Leave' THEN 1 ELSE 0 END) as total_leave
            FROM attendance
            WHERE org_domain = %s
        """
        params = [domain]
        if month:
            query += " AND DATE_FORMAT(date, '%Y-%m') = %s"
            params.append(month)
        cursor.execute(query, params)
        overall = cursor.fetchone()

        day_query = """
            SELECT date, 
                   SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) as present_count,
                   SUM(CASE WHEN status='Absent' THEN 1 ELSE 0 END) as absent_count
            FROM attendance
            WHERE org_domain = %s
        """
        day_params = [domain]
        if month:
            day_query += " AND DATE_FORMAT(date, '%Y-%m') = %s"
            day_params.append(month)
        day_query += " GROUP BY date ORDER BY date ASC"
        cursor.execute(day_query, day_params)
        day_wise = cursor.fetchall()

        return jsonify({"overall": overall, "day_wise": day_wise}), 200
    finally:
        conn.close()

@analytics_bp.route('/report', methods=['GET'])
def download_org_report():
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT COUNT(*) as count FROM employees WHERE status='Active' AND org_domain = %s", (domain,))
        employees_count = cursor.fetchone()['count']
        cursor.execute("SELECT COALESCE(SUM(net_salary), 0) as total_expense FROM payroll WHERE month_year = DATE_FORMAT(CURRENT_DATE, '%Y-%m') AND org_domain = %s", (domain,))
        expense = float(cursor.fetchone()['total_expense'] or 0)
        cursor.execute("SELECT department, COUNT(*) as count FROM employees WHERE status='Active' AND org_domain = %s GROUP BY department", (domain,))
        departments = cursor.fetchall()
        cursor.execute("SELECT COUNT(*) as pending_leaves FROM leave_requests WHERE status IN ('Pending', 'Manager Approved', 'HR Approved') AND org_domain = %s", (domain,))
        pending_leaves = cursor.fetchone()['pending_leaves']
        cursor.execute("SELECT COUNT(*) as total_payrolls FROM payroll WHERE month_year = DATE_FORMAT(CURRENT_DATE, '%Y-%m') AND org_domain = %s", (domain,))
        total_payrolls = cursor.fetchone()['total_payrolls']

        stats = {
            "total_employees": employees_count,
            "monthly_payroll_expense": expense,
            "department_distribution": departments,
            "pending_leaves": pending_leaves,
            "total_payrolls_this_month": total_payrolls
        }

        pdf_content = generate_organization_report(stats, domain)
        return send_file(
            io.BytesIO(pdf_content),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"Executive_Report_{domain.split('.')[0]}.pdf"
        )
    finally:
        conn.close()
