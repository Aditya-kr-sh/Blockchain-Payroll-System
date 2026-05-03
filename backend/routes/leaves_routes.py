from flask import Blueprint, request, jsonify
from models.db import get_db_connection
from utils.auth_utils import get_request_domain
import mysql.connector

leaves_bp = Blueprint('leaves_bp', __name__)

@leaves_bp.route('/types', methods=['GET'])
def get_leave_types():
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM leave_types")
        types = cursor.fetchall()
        return jsonify(types), 200
    finally:
        conn.close()

@leaves_bp.route('/requests', methods=['GET'])
def get_leaves():
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        emp_id = request.args.get('employee_id')
        status_filter = request.args.get('status')
        query = """
            SELECT l.*, e.name as employee_name, e.department, lt.name as leave_type
            FROM leave_requests l
            JOIN employees e ON l.employee_id = e.employee_id
            JOIN leave_types lt ON l.leave_type_id = lt.leave_type_id
            WHERE l.org_domain = %s
        """
        params = [domain]
        if emp_id:
            query += " AND l.employee_id = %s"
            params.append(emp_id)
        if status_filter:
            query += " AND l.status = %s"
            params.append(status_filter)
        query += " ORDER BY l.request_id DESC"
        cursor.execute(query, params)
        records = cursor.fetchall()
        return jsonify(records), 200
    finally:
        conn.close()

@leaves_bp.route('/request', methods=['POST'])
def request_leave():
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    data = request.json
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, reason, org_domain) 
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (data['employee_id'], data['leave_type_id'], data['start_date'],
             data['end_date'], data.get('reason', ''), domain)
        )
        conn.commit()
        req_id = cursor.lastrowid
        return jsonify({"message": "Leave requested", "request_id": req_id}), 201
    finally:
        conn.close()

@leaves_bp.route('/<int:req_id>/status', methods=['PUT'])
def update_status(req_id):
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    data = request.json
    status = data.get('status')
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE leave_requests SET status=%s WHERE request_id=%s AND org_domain=%s", 
            (status, req_id, domain)
        )
        conn.commit()
        return jsonify({"message": f"Leave {status}"}), 200
    finally:
        conn.close()

@leaves_bp.route('/balance/<int:emp_id>', methods=['GET'])
def get_leave_balance(emp_id):
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT lt.leave_type_id, lt.name as leave_type,
                   COALESCE(SUM(DATEDIFF(lr.end_date, lr.start_date) + 1), 0) as used_days,
                   CASE lt.name
                       WHEN 'Sick Leave' THEN 12
                       WHEN 'Casual Leave' THEN 10
                       WHEN 'Paid Leave' THEN 15
                       WHEN 'Unpaid Leave' THEN 365
                       ELSE 10
                   END as total_days
            FROM leave_types lt
            LEFT JOIN leave_requests lr 
                ON lt.leave_type_id = lr.leave_type_id 
                AND lr.employee_id = %s 
                AND lr.org_domain = %s
                AND lr.status = 'Approved'
            GROUP BY lt.leave_type_id, lt.name
        """, (emp_id, domain))
        balances = cursor.fetchall()
        return jsonify(balances), 200
    finally:
        conn.close()

@leaves_bp.route('/analytics', methods=['GET'])
def get_leave_analytics():
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT lt.name as leave_type, COUNT(*) as total_requests,
                   SUM(CASE WHEN lr.status='Approved' THEN 1 ELSE 0 END) as approved,
                   SUM(CASE WHEN lr.status='Rejected' THEN 1 ELSE 0 END) as rejected,
                   SUM(CASE WHEN lr.status='Pending' THEN 1 ELSE 0 END) as pending
            FROM leave_requests lr
            JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
            WHERE lr.org_domain = %s
            GROUP BY lt.leave_type_id, lt.name
        """, (domain,))
        analytics = cursor.fetchall()
        return jsonify(analytics), 200
    finally:
        conn.close()
