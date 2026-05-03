from flask import Blueprint, request, jsonify
from models.db import get_db_connection
from utils.auth_utils import extract_domain
from extensions import bcrypt, jwt
from flask_jwt_extended import create_access_token
import mysql.connector

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/login', methods=['POST'])
def unified_login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if user and bcrypt.check_password_hash(user['password'], password):
            access_token = create_access_token(
                identity=user['email'],
                additional_claims={"role": user['role'], "org_domain": user['org_domain'], "user_id": user['id']}
            )
            return jsonify({
                "message": "Login successful",
                "access_token": access_token,
                "user": {
                    "id": user['id'],
                    "email": user['email'],
                    "role": user['role'],
                    "org_domain": user['org_domain']
                }
            }), 200
        else:
            return jsonify({"error": "Invalid credentials"}), 401
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
    finally:
        if conn:
            conn.close()

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'Employee')

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    org_domain = extract_domain(email) or 'adaptivepay.com'
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (email, password, role, org_domain) VALUES (%s, %s, %s, %s)",
            (email, hashed_password, role, org_domain)
        )
        conn.commit()
        return jsonify({"message": "User registered successfully", "org_domain": org_domain}), 201
    except mysql.connector.Error as err:
        if err.errno == 1062:
            return jsonify({"error": "Email already exists"}), 409
        return jsonify({"error": str(err)}), 500
    finally:
        if conn:
            conn.close()
