import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

def verify():
    with open('log.txt', 'w') as f:
        try:
            conn = mysql.connector.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                user=os.getenv('DB_USER', 'root'),
                password=os.getenv('DB_PASSWORD', ''),
                database=os.getenv('DB_NAME', 'adaptive_payroll')
            )
            cursor = conn.cursor()
            cursor.execute("SELECT p.payroll_id, e.name, p.net_salary FROM payroll p JOIN employees e ON p.employee_id = e.employee_id WHERE p.month_year = '2026-03'")
            records = cursor.fetchall()
            f.write(f"Found {len(records)} records for 2026-03\n")
            for r in records:
                f.write(str(r) + "\n")
            conn.close()
        except Exception as e:
            f.write(f"Error: {e}\n")

if __name__ == "__main__":
    verify()
