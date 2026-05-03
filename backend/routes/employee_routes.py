from flask import Blueprint, request, jsonify
from models.db import get_db_connection
from blockchain.audit_chain import audit_chain
from utils.auth_utils import get_request_domain
import mysql.connector

employee_bp = Blueprint('employee_bp', __name__)

@employee_bp.route('/', methods=['GET'])
def get_employees():
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain (X-Org-Domain) required"}), 400
        
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        search = request.args.get('search', '')
        dept = request.args.get('department', '')
        
        query = "SELECT * FROM employees WHERE status='Active' AND org_domain = %s"
        params = [domain]
        
        if search:
            query += " AND (name LIKE %s OR email LIKE %s OR role LIKE %s)"
            params.extend([f'%{search}%', f'%{search}%', f'%{search}%'])
        
        if dept and dept != 'All Departments':
            query += " AND department = %s"
            params.append(dept)
            
        cursor.execute(query, params)
        employees = cursor.fetchall()
        return jsonify(employees), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
    finally:
        if conn:
            conn.close()

@employee_bp.route('/departments', methods=['GET'])
def get_departments():
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT DISTINCT department FROM employees WHERE department IS NOT NULL AND status='Active' AND org_domain = %s", 
            (domain,)
        )
        departments = [row['department'] for row in cursor.fetchall()]
        return jsonify(departments), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
    finally:
        if conn:
            conn.close()

@employee_bp.route('/<int:emp_id>', methods=['GET'])
def get_employee(emp_id):
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM employees WHERE employee_id = %s AND org_domain = %s", (emp_id, domain))
        emp = cursor.fetchone()
        if not emp:
            return jsonify({"error": "Employee not found in your organization"}), 404
        return jsonify(emp), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
    finally:
        if conn:
            conn.close()

@employee_bp.route('/', methods=['POST'])
def add_employee():
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    data = request.json
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO employees (name, email, phone, department, role, base_salary, joining_date, org_domain)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (data['name'], data['email'], data.get('phone', ''), data['department'],
             data['role'], data['base_salary'], data.get('joining_date'), domain)
        )
        conn.commit()
        emp_id = cursor.lastrowid
        
        # Log to blockchain
        audit_chain.add_block(data={
            "action": "EMPLOYEE_ADDED",
            "employee_id": emp_id,
            "org_domain": domain,
            "name": data['name']
        })
        
        return jsonify({"message": "Employee added successfully", "employee_id": emp_id}), 201
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
    finally:
        if conn:
            conn.close()

@employee_bp.route('/<int:emp_id>', methods=['PUT'])
def update_employee(emp_id):
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    data = request.json
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """UPDATE employees SET name=%s, email=%s, phone=%s, department=%s, 
               role=%s, base_salary=%s, joining_date=%s 
               WHERE employee_id=%s AND org_domain=%s""",
            (data['name'], data['email'], data.get('phone', ''), data['department'],
             data['role'], data['base_salary'], data.get('joining_date'), emp_id, domain)
        )
        conn.commit()
        
        # Log to blockchain
        audit_chain.add_block(data={
            "action": "EMPLOYEE_UPDATED",
            "employee_id": emp_id,
            "org_domain": domain,
            "name": data['name']
        })
        
        return jsonify({"message": "Employee updated successfully"}), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
    finally:
        if conn:
            conn.close()

@employee_bp.route('/<int:emp_id>', methods=['DELETE'])
def delete_employee(emp_id):
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        # Check ownership first
        cursor.execute("SELECT name FROM employees WHERE employee_id=%s AND org_domain=%s", (emp_id, domain))
        emp = cursor.fetchone()
        if not emp:
            return jsonify({"error": "Not authorized to delete this record"}), 403
            
        cursor.execute("UPDATE employees SET status='Inactive' WHERE employee_id=%s AND org_domain=%s", (emp_id, domain))
        conn.commit()
        
        # Log to blockchain
        audit_chain.add_block(data={
            "action": "EMPLOYEE_INACTIVATED",
            "employee_id": emp_id,
            "org_domain": domain,
            "name": emp['name']
        })
        
        return jsonify({"message": "Employee marked inactive"}), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
    finally:
        if conn:
            conn.close()
