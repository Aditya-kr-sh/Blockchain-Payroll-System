import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

const statusColors = { Generated: 'badge-yellow', Pending: 'badge-yellow', 'Manager Approved': 'badge-blue', 'HR Approved': 'badge-indigo', 'Final Approved': 'badge-green', 'Stored in Blockchain': 'badge-green' };

const Payroll = () => {
  const [employees, setEmployees] = useState([]);
  const [empId, setEmpId] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [overtime, setOvertime] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    api.get('/employees/').then(r => setEmployees(r.data));
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    api.get('/payroll/history').then(res => setHistory(res.data));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setResult(null);
    try {
      const res = await api.post('/payroll/generate', { employee_id: empId, month, overtime, bonus });
      setResult(res.data.data);
      fetchHistory();
      setOvertime(0); setBonus(0);
    } catch (error) {
      setErrorMsg(error.response?.data?.error || 'Error generating payroll');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (payrollId) => {
    try {
      await api.put(`/payroll/${payrollId}/approve`, {});
      fetchHistory();
      setErrorMsg('');
    } catch (error) {
      setErrorMsg(error.response?.data?.error || 'Role validation error');
    }
  };

  const userRole = localStorage.getItem('userRole') || '';

  const canApprove = (status) => {
    if (userRole === 'Manager' && status === 'Pending') return true;
    if (userRole === 'HR' && status === 'Manager Approved') return true;
    if (userRole === 'Admin' && status === 'HR Approved') return true;
    return false;
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="page-title gradient-text">Adaptive Payroll Engine</h1>
        <p className="page-subtitle">Dynamically calculate salaries based on attendance, tax slabs, and allowances.</p>
      </div>

      {/* Engine Form + Result */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-card p-6 h-fit">
          <h2 className="text-base font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
            <CurrencyDollarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Run Payroll Engine
          </h2>
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm font-medium">
              ❌ {errorMsg}
            </div>
          )}
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Employee</label>
              <select required className="input-field" value={empId} onChange={e => setEmpId(e.target.value)}>
                <option value="">Select Employee</option>
                {employees.map(e => (
                  <option key={e.employee_id} value={e.employee_id}>
                    {e.name} — {e.department} (₹{Number(e.base_salary).toLocaleString()} base)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Month</label>
              <input type="month" required className="input-field" value={month} onChange={e => setMonth(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Overtime Pay (₹)</label>
                <input type="number" min="0" className="input-field" value={overtime} onChange={e => setOvertime(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Bonus (₹)</label>
                <input type="number" min="0" className="input-field" value={bonus} onChange={e => setBonus(e.target.value)} />
              </div>
            </div>
            <button disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Crunching Numbers...</>
              ) : 'Generate Payroll'}
            </button>
          </form>
        </div>

        {/* Result */}
        {result ? (
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-2xl shadow-2xl relative overflow-hidden animate-fade-in-up">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20 pointer-events-none" />
            <h2 className="text-lg font-bold text-indigo-100 mb-6">✅ Payroll Generated</h2>
            <div className="space-y-3 relative z-10">
              {[
                { label: 'Base Salary', val: `₹${Number(result.base_salary).toLocaleString()}`, color: 'text-white' },
                { label: 'Overtime Pay', val: `+₹${Number(result.overtime_pay).toLocaleString()}`, color: 'text-emerald-400' },
                { label: 'Bonus', val: `+₹${Number(result.bonus).toLocaleString()}`, color: 'text-emerald-400' },
                { label: 'Leave Deduction', val: `-₹${Number(result.leave_deduction).toLocaleString()}`, color: 'text-rose-400' },
                { label: 'Tax Deduction', val: `-₹${Number(result.tax_deduction).toLocaleString()}`, color: 'text-rose-400' },
              ].map(i => (
                <div key={i.label} className="flex justify-between items-center pb-2 border-b border-indigo-800/40">
                  <span className="text-slate-400 text-sm">{i.label}</span>
                  <span className={`font-bold ${i.color}`}>{i.val}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-indigo-700/50 flex justify-between items-center relative z-10">
              <div>
                <p className="text-slate-400 text-xs font-semibold mb-0.5">NET SALARY</p>
                <span className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-teal-200">
                  ₹{Number(result.net_salary).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card flex items-center justify-center p-10">
            <p className="text-gray-400 text-sm text-center">
              Select an employee and month, then<br/>run the engine to see the live breakdown.
            </p>
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="glass-card p-6">
        <h2 className="text-base font-bold text-gray-800 dark:text-white mb-5">Payroll History</h2>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Employee</th><th>Dept</th><th>Month</th><th>Base</th><th>Deductions</th><th>Net Salary</th><th>Status</th><th>Actions</th></tr>
            </thead>
             <tbody>
               {history.map(item => (
                 <tr key={item.payroll_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                   <td><span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">#{String(item.employee_id).padStart(3, '0')}</span></td>
                   <td className="font-semibold text-gray-800 dark:text-white">{item.employee_name}</td>
                   <td><span className="badge badge-blue">{item.department}</span></td>
                   <td className="text-gray-600 dark:text-slate-400">{item.month_year}</td>
                   <td className="text-gray-700 dark:text-slate-300">₹{Number(item.base_salary).toLocaleString()}</td>
                   <td className="text-red-500 font-medium">-₹{(Number(item.leave_deduction) + Number(item.tax_deduction)).toLocaleString()}</td>
                   <td className="font-black text-gray-900 dark:text-white">₹{Number(item.net_salary).toLocaleString()}</td>
                   <td><span className={`badge ${statusColors[item.status] || 'badge-gray'}`}>{item.status}</span></td>
                  <td>
                    {canApprove(item.status) && (
                      <button onClick={() => handleApprove(item.payroll_id)}
                        className="text-xs btn-success py-1 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded">Validate</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {history.length === 0 && <p className="text-center text-gray-400 py-8">No payroll history found. Generate payroll to get started.</p>}
        </div>
      </div>
    </div>
  );
};

export default Payroll;
