from models.db import get_db_connection

def list_data():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        print("\n--- DATABASES FOUND ---")
        cursor.execute("SHOW DATABASES LIKE 'adaptive_payroll'")
        db = cursor.fetchone()
        if db:
            print(f"Found Database: {list(db.values())[0]}")
        else:
            print("Database 'adaptive_payroll' NOT found.")
            return

        print("\n--- TABLES IN adaptive_payroll ---")
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        for table in tables:
            print(f"Table: {list(table.values())[0]}")

        print("\n--- SAMPLE EMPLOYEES ---")
        cursor.execute("SELECT name, email, department FROM employees LIMIT 5")
        employees = cursor.fetchall()
        for emp in employees:
            print(f"Employee: {emp['name']} ({emp['email']}) - Dept: {emp['department']}")
            
        conn.close()
    except Exception as e:
        print(f"\nError: {e}")

if __name__ == "__main__":
    list_data()
