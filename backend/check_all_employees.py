import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

def check_all_employees():
    with open('all_employees_debug.txt', 'w') as f:
        try:
            conn = mysql.connector.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                user=os.getenv('DB_USER', 'root'),
                password=os.getenv('DB_PASSWORD', ''),
                database=os.getenv('DB_NAME', 'adaptive_payroll')
            )
            cursor = conn.cursor(dictionary=True)
            
            cursor.execute("SELECT name, joining_date, status, org_domain FROM employees")
            records = cursor.fetchall()
            f.write(f"TOTAL EMPLOYEES IN DATABASE: {len(records)}\n\n")
            for r in records:
                f.write(f"- {r['name']} | Status: {r['status']} | Domain: {r['org_domain']} | Joined: {r['joining_date']}\n")
            
            conn.close()
        except Exception as e:
            f.write(f"Error: {e}\n")

if __name__ == "__main__":
    check_all_employees()
