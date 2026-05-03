
import mysql.connector
import os
import random
from dotenv import load_dotenv

# Load env from backend folder
load_dotenv('backend/.env')

db_config = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "adaptive_payroll")
}

indian_names = [
    "Aarav Sharma", "Vivaan Patel", "Aditya Gupta", "Vihaan Singh", "Arjun Reddy",
    "Sai Kumar", "Reyansh Mehta", "Aaryan Khan", "Ishaan Verma", "Krishna Iyer",
    "Ananya Rao", "Diya Malhotra", "Pari Saxena", "Anika Joshi", "Saanvi Kulkarni",
    "Aadhya Nair", "Myra Choudhury", "Sara Mishra", "Sanya Bansal", "Riya Trivedi",
    "Rahul Deshmukh", "Priya Singh", "Amitabh Bachchan", "Shah Rukh Khan", "Arjun Kapoor",
    "Deepika Padukone", "Priyanka Chopra", "Virat Kohli", "Mahendra Singh Dhoni", "Rohit Sharma"
]

def update_employees():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # Get the first admin's domain to use for all employees (simplification)
        # or we can check if there are multiple domains. 
        # For now, let's assume we use the domain from the current employee emails if possible,
        # or just 'amazon.com' as requested in the example earlier.
        cursor.execute("SELECT org_domain FROM admins LIMIT 1")
        admin = cursor.fetchone()
        domain = admin['org_domain'] if admin else 'organization.com'

        cursor.execute("SELECT employee_id FROM employees")
        employees = cursor.fetchall()

        used_names = []

        for emp in employees:
            name = random.choice(indian_names)
            while name in used_names:
                name = random.choice(indian_names)
            used_names.append(name)

            email_name = name.lower().replace(" ", ".")
            email = f"{email_name}@{domain}"
            salary = random.randint(200000, 1200000)

            cursor.execute("""
                UPDATE employees 
                SET name = %s, email = %s, base_salary = %s 
                WHERE employee_id = %s
            """, (name, email, salary, emp['employee_id']))

        conn.commit()
        print(f"Successfully updated {len(employees)} employees with Indian names and new salaries.")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_employees()
