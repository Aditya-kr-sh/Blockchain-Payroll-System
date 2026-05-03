# Adaptive Payroll System with Blockchain Audit

A modern, production-ready Payroll Management System featuring a React-based frontend, a Flask-based backend, and a Blockchain-powered audit trail for financial integrity.

---

## 🚀 Quick Start

### 1. Database Setup (MySQL)
The system uses MySQL for data persistence.
1.  Ensure you have a MySQL server running locally.
2.  Navigate to the `backend` directory and configure your credentials in the `.env` file:
    ```env
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=your_password
    DB_NAME=adaptive_payroll
    ```
3.  Run the initialization script to create the database and tables:
    ```bash
    python init_db.py
    ```
    *This will create the `adaptive_payroll` database and all required tables with initial sample data using `database/schema.sql`.*

### 2. Backend Setup (Flask)
1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Create a virtual environment:
    ```bash
    python -m venv venv
    ```
3.  Activate the virtual environment:
    - **Windows:** `venv\Scripts\activate`
    - **macOS/Linux:** `source venv/bin/activate`
4.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
5.  Run the backend:
    ```bash
    python app.py
    ```
    *The API will be available at [http://localhost:5000](http://localhost:5000)*

### 3. Frontend Setup (React/Vite)
1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
    *The frontend will be available at [http://localhost:5173](http://localhost:5173)*

---

## 🛠️ Project Structure

```text
├── backend/                # Flask Application
│   ├── blockchain/         # Blockchain Audit Logic
│   ├── models/             # Database Models & Connection
│   ├── routes/             # API Endpoints
│   ├── services/           # Business Logic (Payroll, Payslips)
│   └── app.py              # Application Entry Point
├── frontend/               # React Application (Vite/Tailwind)
│   ├── src/
│   │   ├── components/     # Reusable UI Components
│   │   ├── pages/          # Application Pages
│   │   └── services/       # API Service Integrations
│   └── package.json
└── database/
    └── schema.sql          # MySQL Schema & Sample Data
```

-   **Employee Management**: Detailed profiles with Indian regional context (Names, Schools, Districts) and status tracking.
-   **Automated Payroll**: Calculates gross/net pay, taxes (using progressive Indian tax slabs), bonuses, and deductions.
-   **Blockchain Audit**: Every sensitive operation is stored as an immutable block in a custom audit chain.
-   **Pro Premium UI**: Fully responsive design with **Enhanced Dark Mode** support and dynamic theme switching.
-   **Payslip Generation**: Regionalized PDF payslips with INR formatting generated natively.
-   **Attendance & Leaves**: Integrated leave request and attendance tracking system with monthly analytics.
-   **Compliance Dashboard**: Real-time ISO 27001 compliance checking and blockchain integrity verification.
-   **Modern Tech Stack**: React, Tailwind CSS, Flask, MySQL, and Chart.js.

---

## 🔐 Audit Integrity
The system implements a private blockchain for financial transparency. Each payroll record is hashed and linked to the previous record, ensuring that any unauthorized tampering with past payroll data is immediately detectable.
