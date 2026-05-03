from flask_bcrypt import Bcrypt
from flask import Flask
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def migrate():
    # Setup bcrypt for password hashing
    app = Flask(__name__)
    bcrypt = Bcrypt(app)
    
    def get_domain(email):
        return email.split('@')[-1] if email and '@' in email else 'adaptivepay.com'

    try:
        conn = mysql.connector.connect(
            host=os.getenv('DB_HOST'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            database=os.getenv('DB_NAME')
        )
        cursor = conn.cursor(dictionary=True)
        
        # Add columns to existing tables
        tables_to_update = ['employees', 'attendance', 'leave_requests', 'payroll', 'blockchain_blocks', 'tax_slabs']
        for table in tables_to_update:
            try:
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN org_domain VARCHAR(100) DEFAULT 'adaptivepay.com'")
                print(f"Added org_domain to {table}")
            except: pass
        
        # Create admins table if not exists or fix it
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS admins (
                admin_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                org_domain VARCHAR(100) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        try:
            cursor.execute("ALTER TABLE admins ADD COLUMN org_domain VARCHAR(100) NOT NULL AFTER email")
        except: pass

        # Fix all existing admins (Hash passwords and fill domains)
        cursor.execute("SELECT * FROM admins")
        admins = cursor.fetchall()
        for admin in admins:
            updates = []
            params = []
            
            # Domain check
            domain = admin.get('org_domain')
            if not domain or domain.strip() == '':
                domain = get_domain(admin['email'])
                updates.append("org_domain = %s")
                params.append(domain)
            
            # Hash check
            pwd = admin['password_hash']
            if not pwd.startswith('$2b$'):
                hashed = bcrypt.generate_password_hash(pwd).decode('utf-8')
                updates.append("password_hash = %s")
                params.append(hashed)
            
            if updates:
                query = f"UPDATE admins SET {', '.join(updates)} WHERE admin_id = %s"
                params.append(admin['admin_id'])
                cursor.execute(query, tuple(params))
                print(f"Updated admin {admin['email']} (Fixed: {', '.join(updates)})")

        # Insert default admin if no admins exist at all
        if not admins:
            hashed_default = bcrypt.generate_password_hash('admin123').decode('utf-8')
            cursor.execute(
                "INSERT INTO admins (name, email, org_domain, password_hash) VALUES (%s, %s, %s, %s)",
                ('System Admin', 'admin@adaptivepay.com', 'adaptivepay.com', hashed_default)
            )
            print("Created default admin.")
        
        conn.commit()
        print("Migration complete.")
        conn.close()
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
