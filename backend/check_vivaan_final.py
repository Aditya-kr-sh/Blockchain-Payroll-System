import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

def check_vivaan_new_payroll():
    with open('vivaan_check.txt', 'w') as f:
        try:
            conn = mysql.connector.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                user=os.getenv('DB_USER', 'root'),
                password=os.getenv('DB_PASSWORD', ''),
                database=os.getenv('DB_NAME', 'adaptive_payroll')
            )
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM payroll WHERE employee_id=1 AND month_year='2026-03'")
            pay = cursor.fetchone()
            if pay:
                f.write(f"New Payroll for Vivaan:\n")
                f.write(f"Leave Deduction: {pay['leave_deduction']}\n")
                f.write(f"Net Salary: {pay['net_salary']}\n")
            else:
                f.write("No payroll found for Vivaan in 2026-03\n")
            conn.close()
        except Exception as e:
            f.write(f"Error: {e}\n")

if __name__ == "__main__":
    check_vivaan_new_payroll()
