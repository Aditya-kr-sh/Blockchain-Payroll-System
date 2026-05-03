import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

def fix_vivaan_payroll():
    try:
        conn = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'adaptive_payroll')
        )
        cursor = conn.cursor(dictionary=True)
        
        # 1. Approve his leave request
        cursor.execute("UPDATE leave_requests SET status='Approved' WHERE employee_id=1")
        
        # 2. Add another leave request for March 10 to cover the 'Absent' day
        # First get Sick Leave ID
        cursor.execute("SELECT leave_type_id FROM leave_types WHERE name='Sick Leave'")
        sick_id = cursor.fetchone()['leave_type_id']
        
        cursor.execute("""
            INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, reason, status, org_domain)
            VALUES (1, %s, '2026-03-10', '2026-03-10', 'Personal', 'Approved', 'adaptivepay.com')
        """, (sick_id,))
        
        # 3. Delete existing payroll
        cursor.execute("DELETE FROM payroll WHERE employee_id=1 AND month_year='2026-03'")
        
        conn.commit()
        print("Vivaan's records updated and old payroll cleared.")
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_vivaan_payroll()
