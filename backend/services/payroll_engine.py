from models.db import get_db_connection

from models.db import get_db_connection

def get_tax_deduction(annual_salary, domain):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        # Use domain-specific tax slabs
        cursor.execute("SELECT * FROM tax_slabs WHERE org_domain = %s ORDER BY min_salary ASC", (domain,))
        slabs = cursor.fetchall()
        
        # Fallback to default if no custom slabs for domain
        if not slabs:
            cursor.execute("SELECT * FROM tax_slabs WHERE org_domain = 'adaptivepay.com' ORDER BY min_salary ASC")
            slabs = cursor.fetchall()
            
        tax = 0
        for slab in slabs:
            if annual_salary > float(slab['min_salary']):
                max_sal = float(slab['max_salary']) if slab['max_salary'] is not None else float('inf')
                taxable_amount = min(annual_salary, max_sal) - float(slab['min_salary'])
                tax += (taxable_amount * float(slab['tax_rate'])) / 100
        
        return tax / 12
    finally:
        conn.close()

def generate_payroll(employee_id, month, domain, overtime=0, bonus=0):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Verify employee belongs to domain
        cursor.execute("SELECT base_salary FROM employees WHERE employee_id = %s AND org_domain = %s", (employee_id, domain))
        emp = cursor.fetchone()
        if not emp:
            return {"error": "Employee not found in your organization"}
            
        base_salary = float(emp['base_salary'])
        
        # Calculate Deductions - Only deduct for 'Absent' or 'Leave' statuses 
        # BUT skip those dates if there's an APPROVED leave request that is NOT 'Unpaid Leave'
        
        # 1. Get all 'Absent' or 'Leave' dates for this month
        cursor.execute("""
            SELECT date FROM attendance 
            WHERE employee_id = %s AND org_domain = %s 
            AND DATE_FORMAT(date, '%%Y-%%m') = %s AND status IN ('Absent', 'Leave')
        """, (employee_id, domain, month))
        absent_dates = [row['date'] for row in cursor.fetchall()]
        
        # 2. Get all approved paid leave dates for this employee
        cursor.execute("""
            SELECT lr.start_date, lr.end_date, lt.name as type
            FROM leave_requests lr
            JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
            WHERE lr.employee_id = %s AND lr.org_domain = %s 
            AND lr.status = 'Approved' AND lt.name != 'Unpaid Leave'
        """, (employee_id, domain))
        paid_leaves = cursor.fetchall()
        
        paid_leave_dates = set()
        for leave in paid_leaves:
            # Simple date range expansion
            import datetime
            curr = leave['start_date']
            while curr <= leave['end_date']:
                paid_leave_dates.add(curr)
                curr += datetime.timedelta(days=1)
                
        # 3. Calculate actual deductible days (Absences not covered by paid leave)
        deductible_days = 0
        for d in absent_dates:
            if d not in paid_leave_dates:
                deductible_days += 1
        
        per_day_salary = base_salary / 30
        leave_deduction = deductible_days * per_day_salary
        
        # Tax Calculation
        projected_annual = base_salary * 12
        monthly_tax = get_tax_deduction(projected_annual, domain)
        
        net_salary = (base_salary + overtime + bonus) - (leave_deduction + monthly_tax)
        
        payroll_record = {
            "employee_id": employee_id,
            "month_year": month,
            "base_salary": base_salary,
            "overtime_pay": overtime,
            "bonus": bonus,
            "leave_deduction": round(leave_deduction, 2),
            "tax_deduction": round(monthly_tax, 2),
            "net_salary": round(net_salary, 2),
            "org_domain": domain
        }
        
        cursor.execute("""
            INSERT INTO payroll (employee_id, month_year, base_salary, overtime_pay, bonus, leave_deduction, tax_deduction, net_salary, org_domain)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (employee_id, month, base_salary, overtime, bonus, payroll_record['leave_deduction'], 
              payroll_record['tax_deduction'], payroll_record['net_salary'], domain))
        
        conn.commit()
        return payroll_record
    finally:
        conn.close()
