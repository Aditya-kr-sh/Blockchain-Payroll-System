import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

def debug_vivaan_full():
    with open('vivaan_full_debug.txt', 'w') as f:
        try:
            conn = mysql.connector.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                user=os.getenv('DB_USER', 'root'),
                password=os.getenv('DB_PASSWORD', ''),
                database=os.getenv('DB_NAME', 'adaptive_payroll')
            )
            cursor = conn.cursor(dictionary=True)
            
            cursor.execute("SELECT * FROM employees WHERE name LIKE '%Vivaan%'")
            vivaan = cursor.fetchone()
            emp_id = vivaan['employee_id']
            f.write(f"Vivaan ID: {emp_id}\n")
            
            cursor.execute("SELECT * FROM attendance WHERE employee_id = %s", (emp_id,))
            attn = cursor.fetchall()
            f.write(f"Attendance:\n")
            for a in attn:
                f.write(f"{a}\n")
            
            cursor.execute("SELECT * FROM payroll WHERE employee_id = %s", (emp_id,))
            pay = cursor.fetchall()
            f.write(f"\nPayroll:\n")
            for p in pay:
                f.write(f"{p}\n")
                
            conn.close()
        except Exception as e:
            f.write(f"Error: {e}\n")

if __name__ == "__main__":
    debug_vivaan_full()
