import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

def check_domain_growth(domain):
    with open('domain_growth_debug.txt', 'w') as f:
        try:
            conn = mysql.connector.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                user=os.getenv('DB_USER', 'root'),
                password=os.getenv('DB_PASSWORD', ''),
                database=os.getenv('DB_NAME', 'adaptive_payroll')
            )
            cursor = conn.cursor(dictionary=True)
            
            f.write(f"--- ANALYZING DOMAIN: {domain} ---\n\n")
            
            # 1. Current Active Employees in this domain
            cursor.execute("SELECT name, joining_date, org_domain FROM employees WHERE status='Active' AND org_domain = %s", (domain,))
            current_emps = cursor.fetchall()
            f.write(f"Total Current Active in {domain}: {len(current_emps)}\n")
            for e in current_emps:
                f.write(f"- {e['name']} (Joined: {e['joining_date']})\n")
            
            # 2. Employees in this domain joined before March 1st, 2026
            cursor.execute("SELECT name, joining_date FROM employees WHERE joining_date < '2026-03-01' AND org_domain = %s AND status='Active'", (domain,))
            prev_emps = cursor.fetchall()
            f.write(f"\nJoined before 2026-03-01 in {domain}: {len(prev_emps)}\n")
            for e in prev_emps:
                f.write(f"- {e['name']} (Joined: {e['joining_date']})\n")
            
            # 3. Just to be sure, check if there are employees with NULL or empty domains
            cursor.execute("SELECT name, joining_date, org_domain FROM employees WHERE org_domain IS NULL OR org_domain = ''")
            null_domain = cursor.fetchall()
            if null_domain:
                f.write(f"\nWARNING: Found {len(null_domain)} employees with NULL/Empty domain!\n")
                for e in null_domain:
                    f.write(f"- {e['name']} (Domain: '{e['org_domain']}')\n")

            conn.close()
        except Exception as e:
            f.write(f"Error: {e}\n")

if __name__ == "__main__":
    check_domain_growth('adaptivepay.com')
