import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Payroll from './pages/Payroll';
import Payslips from './pages/Payslips';
import Analytics from './pages/Analytics';
import BlockchainViewer from './pages/BlockchainViewer';
import TaxSlabs from './pages/TaxSlabs';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';



function App() {
  const [isAdmin, setIsAdmin] = useState(
    localStorage.getItem('isAdmin') === 'true'
  );
  const [isEmployee, setIsEmployee] = useState(
    localStorage.getItem('isEmployee') === 'true'
  );
  const [employeeId, setEmployeeId] = useState(
    localStorage.getItem('employeeId') || null
  );

  useEffect(() => {
    const domain = localStorage.getItem('orgDomain');
    if ((isAdmin || isEmployee) && !domain) {
      handleLogout();
    }
  }, [isAdmin, isEmployee]);

  const handleAdminLogin = () => {
    setIsAdmin(true);
    setIsEmployee(false);
  };

  const handleEmployeeLogin = (id) => {
    setIsEmployee(true);
    setIsAdmin(false);
    setEmployeeId(id);
    localStorage.setItem('employeeId', id);
    localStorage.setItem('isEmployee', 'true');
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('isEmployee');
    localStorage.removeItem('employeeId');
    localStorage.removeItem('orgDomain');
    setIsAdmin(false);
    setIsEmployee(false);
    setEmployeeId(null);
  };

  if (!isAdmin && !isEmployee) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login onAdminLogin={handleAdminLogin} onEmployeeLogin={handleEmployeeLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  if (isEmployee) {
    return (
      <Router>
        <Routes>
          <Route path="/employee-dashboard" element={<EmployeeDashboard employeeId={employeeId} onLogout={handleLogout} />} />
          <Route path="*" element={<Navigate to="/employee-dashboard" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="flex h-screen text-gray-800 dark:text-gray-100 font-sans overflow-hidden bg-slate-50 dark:bg-hr-darkBg transition-colors duration-500">
        <Sidebar onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto w-full relative">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100/40 dark:bg-indigo-900/10 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-100/30 dark:bg-purple-900/10 rounded-full blur-[80px] -z-10 -translate-x-1/4 translate-y-1/4"></div>

          <div className="px-8 py-10 max-w-7xl mx-auto min-h-full animate-fade-in-up">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/leaves" element={<Leaves />} />
              <Route path="/payroll" element={<Payroll />} />
              <Route path="/payslips" element={<Payslips />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/tax" element={<TaxSlabs />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
