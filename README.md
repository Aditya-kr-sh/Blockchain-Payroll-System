# 🚀 AdaptivePay: Modern Payroll & Workforce Management

AdaptivePay is a state-of-the-art, full-stack payroll SaaS platform designed for the modern enterprise. It combines seamless workforce orchestration with a **cryptographic blockchain audit trail**, ensuring every financial operation is transparent, immutable, and secure.

![Dashboard Preview](https://via.placeholder.com/1200x600?text=AdaptivePay+Enterprise+Dashboard)

## ✨ Key Features

- **🛡️ Blockchain Audit Log**: Every payroll generation, leave approval, and employee update is hashed and stored in a secure blockchain ledger.
- **📈 Advanced Analytics**: Real-time insights into workforce growth, department distribution, and monthly payout trends.
- **🌴 Hierarchical Leave Management**: Multi-level approval flow (Manager -> HR -> Admin) with an interactive timeline.
- **💰 Automated Payroll**: Intelligent tax slab calculations (Standard/Old/New regimes) and automated net salary processing.
- **📱 Responsive Design**: Fully optimized for mobile and desktop, featuring a "glassmorphism" UI with dark mode support.
- **🔒 Secure Auth**: Role-based access control (RBAC) with JWT encryption.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, HeroIcons, Chart.js.
- **Backend**: Python (Flask), Flask-JWT-Extended, Flask-Bcrypt.
- **Database**: MySQL with Connection Pooling.
- **Blockchain**: SHA-256 Hashing Algorithm with a linked-block architecture.

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.9+
- Node.js 16+
- MySQL Server

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
# Copy .env.example to .env and fill in your DB credentials
python init_db.py
python app.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🔒 Security & Privacy
AdaptivePay is built with security as a first-class citizen. It uses **Industry-Standard Bcrypt** for password hashing and **JWT (JSON Web Tokens)** for stateless session management. The blockchain implementation ensures that no payroll record can be altered after it has been finalized.

---
Built with ❤️ for Modern Enterprises.
