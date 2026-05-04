from flask import Blueprint, request, jsonify
from models.db import get_db_connection
from models.db import get_db_connection
from utils.auth_utils import get_request_domain, role_required
from flask_jwt_extended import get_jwt
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
@role_required(['Manager', 'HR', 'Admin', 'Employee'])
def get_leaves():
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    claims = get_jwt()
    user_role = claims.get('role')
    user_emp_id = claims.get('employee_id')

    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        emp_id = request.args.get('employee_id')
        
        # Security: Employees can only see their own requests
        if user_role == 'Employee':
            emp_id = user_emp_id

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
@role_required(['Manager', 'HR', 'Admin'])
def update_status(req_id):
    claims = get_jwt()
    domain = claims.get('org_domain', get_request_domain())
    user_role = claims.get('role')
    
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    data = request.json
    action = data.get('status') # 'Approved' or 'Rejected'
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        # 1. Fetch current status
        cursor.execute("SELECT * FROM leave_requests WHERE request_id=%s AND org_domain=%s", (req_id, domain))
        leave_req = cursor.fetchone()
        
        if not leave_req:
            return jsonify({"error": "Leave request not found"}), 404
            
        current_status = leave_req['status']
        new_status = current_status
        
        if action == 'Rejected':
            new_status = 'Rejected'
        else:
            # Multi-level approval logic
            if user_role == 'Manager':
                if current_status != 'Pending':
                    return jsonify({"error": "Manager can only approve Pending requests"}), 403
                new_status = 'Manager Approved'
            elif user_role == 'HR':
                if current_status != 'Manager Approved':
                    return jsonify({"error": "HR can only approve Manager Approved requests"}), 403
                new_status = 'HR Approved'
            elif user_role == 'Admin':
                if current_status != 'HR Approved':
                    return jsonify({"error": "Admin can only approve HR Approved requests"}), 403
                new_status = 'Approved'
            else:
                return jsonify({"error": "Unauthorized role"}), 403

        # 2. Update Database
        cursor.execute(
            "UPDATE leave_requests SET status=%s WHERE request_id=%s AND org_domain=%s", 
            (new_status, req_id, domain)
        )
        conn.commit()

        # 3. Log to Blockchain if final approval or rejection
        if new_status in ['Approved', 'Rejected']:
            from blockchain.audit_chain import audit_chain
            audit_chain.add_block(data={
                "action": f"LEAVE_{new_status.upper()}",
                "request_id": req_id,
                "employee_id": leave_req['employee_id'],
                "org_domain": domain
            })

        return jsonify({"message": f"Leave status updated to {new_status}"}), 200
    finally:
        conn.close()

@leaves_bp.route('/balance/<int:emp_id>', methods=['GET'])
@role_required(['Manager', 'HR', 'Admin', 'Employee'])
def get_leave_balance(emp_id):
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    claims = get_jwt()
    if claims.get('role') == 'Employee' and claims.get('employee_id') != emp_id:
        return jsonify({"error": "Unauthorized"}), 403

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
@role_required(['Manager', 'HR', 'Admin'])
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
