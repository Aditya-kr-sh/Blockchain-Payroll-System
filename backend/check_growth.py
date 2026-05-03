import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

def check_employees():
    with open('growth_data.txt', 'w') as f:
        try:
            conn = mysql.connector.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                user=os.getenv('DB_USER', 'root'),
                password=os.getenv('DB_PASSWORD', ''),
                database=os.getenv('DB_NAME', 'adaptive_payroll')
            )
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT name, joining_date FROM employees")
            records = cursor.fetchall()
            f.write(f"Total Employees: {len(records)}\n")
            for r in records:
                f.write(f"- {r['name']}: {r['joining_date']}\n")
            
            cursor.execute("SELECT COUNT(*) as count FROM employees WHERE joining_date < '2026-03-01'")
            prev_count = cursor.fetchone()['count']
            f.write(f"\nEmployees joined before 2026-03-01: {prev_count}\n")
            
            conn.close()
        except Exception as e:
            f.write(f"Error: {e}\n")

if __name__ == "__main__":
    check_employees()
