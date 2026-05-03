import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { UserCircleIcon, IdentificationIcon, BuildingOfficeIcon, CurrencyDollarIcon, CalendarDaysIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';

const EmployeeDashboard = ({ employeeId, onLogout }) => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.theme = newTheme ? 'dark' : 'light';
  };

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await api.get(`/employees/${employeeId}`);
        setEmployee(response.data);
      } catch (err) {
        console.error("Error fetching employee details:", err);
      } finally {
        setLoading(false);
      }
    };
    if (employeeId) {
      fetchEmployee();
    }
  }, [employeeId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors duration-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors duration-500">
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Profile Not Found</h2>
          <button onClick={onLogout} className="text-indigo-600 dark:text-indigo-400 hover:underline">Return to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hr-bg dark:bg-hr-darkBg transition-colors duration-500 font-sans p-6 md:p-12 relative overflow-hidden">
      
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-400/10 dark:bg-indigo-900/40 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-400/10 dark:bg-teal-900/40 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <div className="max-w-4xl mx-auto relative z-10 flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">
            <span className="text-white">{localStorage.getItem('orgDomain')?.charAt(0).toUpperCase() || 'A'}</span>
            <span className="text-teal-400">P</span>
          </div>
          <span className="text-2xl font-bold text-slate-800 dark:text-white">
            {localStorage.getItem('orgDomain')?.split('.')[0].toUpperCase() || 'AdaptivePay'} Service
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme} 
            className="p-2.5 bg-white dark:bg-slate-800 rounded-full shadow-md text-slate-600 dark:text-yellow-500 hover:scale-110 transition-transform"
          >
            {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto relative z-10 animate-fade-in-up">
        
        {/* Welcome Card */}
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 md:p-12 shadow-xl border border-slate-100 dark:border-slate-700 mb-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-teal-400"></div>
          
          <div className="w-32 h-32 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 shadow-inner">
            <UserCircleIcon className="w-20 h-20 text-slate-400 dark:text-slate-500" />
          </div>
          
          <div className="text-center md:text-left">
            <div className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
              {employee.status} Employee
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{employee.name}</h1>
            <p className="text-xl font-medium text-slate-500 dark:text-slate-400">{employee.role}</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <DetailCard 
            icon={<IdentificationIcon className="w-6 h-6" />}
            label="Employee ID"
            value={`EMP-${String(employee.employee_id).padStart(4, '0')}`}
            delay="0s"
          />
          
          <DetailCard 
            icon={<BuildingOfficeIcon className="w-6 h-6" />}
            label="Department"
            value={employee.department}
            delay="0.1s"
          />
          
          <DetailCard 
            icon={<CurrencyDollarIcon className="w-6 h-6" />}
            label="Base Salary"
            value={`₹${parseFloat(employee.base_salary).toLocaleString('en-IN')}`}
            delay="0.2s"
          />
          
          <DetailCard 
            icon={<CalendarDaysIcon className="w-6 h-6" />}
            label="Joining Date"
            value={new Date(employee.joining_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            delay="0.3s"
          />

        </div>
        
        {/* Footer info */}
        <div className="mt-12 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
           Data is securely synced with your organization's verified ledger. If you notice discrepancies, contact HR.
        </div>
      </div>
    </div>
  );
};

const DetailCard = ({ icon, label, value, delay }) => (
  <div 
    className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up"
    style={{ animationFillMode: 'both', animationDelay: delay }}
  >
    <div className="p-3 bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl">
      {icon}
    </div>
    <div>
      <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-black text-slate-800 dark:text-slate-200">{value}</p>
    </div>
  </div>
);

export default EmployeeDashboard;
