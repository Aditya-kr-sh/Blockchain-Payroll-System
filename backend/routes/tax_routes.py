from flask import Blueprint, request, jsonify
from models.db import get_db_connection
from utils.auth_utils import get_request_domain
import mysql.connector

tax_bp = Blueprint('tax_bp', __name__)

@tax_bp.route('/slabs', methods=['GET'])
def get_tax_slabs():
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM tax_slabs WHERE org_domain = %s ORDER BY min_salary ASC", (domain,))
        slabs = cursor.fetchall()
        
        # Fallback to default if no custom slabs for domain
        if not slabs:
            cursor.execute("SELECT * FROM tax_slabs WHERE org_domain = 'adaptivepay.com' ORDER BY min_salary ASC")
            slabs = cursor.fetchall()
            
        return jsonify(slabs), 200
    finally:
        conn.close()

@tax_bp.route('/slabs', methods=['POST'])
def add_tax_slab():
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    data = request.json
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO tax_slabs (min_salary, max_salary, tax_rate, org_domain) VALUES (%s, %s, %s, %s)",
            (data['min_salary'], data.get('max_salary'), data['tax_rate'], domain)
        )
        conn.commit()
        slab_id = cursor.lastrowid
        return jsonify({"message": "Tax slab added", "slab_id": slab_id}), 201
    finally:
        conn.close()

@tax_bp.route('/slabs/<int:slab_id>', methods=['PUT'])
def update_tax_slab(slab_id):
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    data = request.json
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE tax_slabs SET min_salary=%s, max_salary=%s, tax_rate=%s WHERE slab_id=%s AND org_domain=%s",
            (data['min_salary'], data.get('max_salary'), data['tax_rate'], slab_id, domain)
        )
        conn.commit()
        return jsonify({"message": "Tax slab updated"}), 200
    finally:
        conn.close()

@tax_bp.route('/slabs/<int:slab_id>', methods=['DELETE'])
def delete_tax_slab(slab_id):
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM tax_slabs WHERE slab_id=%s AND org_domain=%s", (slab_id, domain))
        conn.commit()
        return jsonify({"message": "Tax slab deleted"}), 200
    finally:
        conn.close()
