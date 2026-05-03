import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

def debug_vivaan():
    with open('vivaan_debug.txt', 'w') as f:
        try:
            conn = mysql.connector.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                user=os.getenv('DB_USER', 'root'),
                password=os.getenv('DB_PASSWORD', ''),
                database=os.getenv('DB_NAME', 'adaptive_payroll')
            )
            cursor = conn.cursor(dictionary=True)
            
            # Find Vivaan
            cursor.execute("SELECT * FROM employees WHERE name LIKE '%Vivaan%'")
            vivaan = cursor.fetchone()
            if not vivaan:
                f.write("Vivaan not found\n")
                return
            
            emp_id = vivaan['employee_id']
            domain = vivaan['org_domain']
            f.write(f"Vivaan ID: {emp_id}, Domain: {domain}, Salary: {vivaan['base_salary']}\n\n")
            
            # Check Attendance for March 2026
            cursor.execute("SELECT * FROM attendance WHERE employee_id = %s AND DATE_FORMAT(date, '%%Y-%%m') = '2026-03'", (emp_id,))
            attn = cursor.fetchall()
            f.write(f"Attendance Records: {len(attn)}\n")
            for a in attn:
                f.write(f"- {a['date']}: {a['status']}\n")
            
            # Check Leaves
            cursor.execute("""
                SELECT lr.*, lt.name as leave_type 
                FROM leave_requests lr 
                JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id 
                WHERE lr.employee_id = %s
            """, (emp_id,))
            leaves = cursor.fetchall()
            f.write(f"\nLeave Requests: {len(leaves)}\n")
            for l in leaves:
                f.write(f"- {l['start_date']} to {l['end_date']} | {l['leave_type']} | Status: {l['status']}\n")
            
            conn.close()
        except Exception as e:
            f.write(f"Error: {e}\n")

if __name__ == "__main__":
    debug_vivaan()
