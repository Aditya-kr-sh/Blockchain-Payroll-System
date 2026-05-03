import mysql.connector
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def initialize_database():
    host = os.getenv("DB_HOST", "localhost")
    user = os.getenv("DB_USER", "root")
    password = os.getenv("DB_PASSWORD", "")
    db_name = os.getenv("DB_NAME", "adaptive_payroll")
    
    # Path to schema.sql
    schema_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'schema.sql')
    
    try:
        # Connect without database first to create it
        conn = mysql.connector.connect(
            host=host,
            user=user,
            password=password
        )
        cursor = conn.cursor()
        
        # Read and execute schema.sql
        print(f"Reading schema from {schema_path}...")
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
            
        # Split by semicolon to execute multiple statements
        # Note: This is a simple split, might need more care for complex SQL
        statements = schema_sql.split(';')
        
        for statement in statements:
            if statement.strip():
                try:
                    cursor.execute(statement)
                except mysql.connector.Error as err:
                    print(f"Warning: Error executing statement: {err}")
                    
        conn.commit()
        print("Database initialized successfully!")
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as err:
        print(f"Error: {err}")

if __name__ == "__main__":
    initialize_database()
