import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { DocumentArrowDownIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const statusColors = { Generated: 'badge-yellow', Approved: 'badge-blue', Paid: 'badge-green' };

const Payslips = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [filterEmployee, setFilterEmployee] = useState('');
  const [employees, setEmployees] = useState([]);
  const [downloadingId, setDownloadingId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPayrolls();
    api.get('/employees/').then(r => setEmployees(r.data));
  }, [filterEmployee]);

  const fetchPayrolls = async () => {
    const res = await api.get('/payroll/history', {
      params: { employee_id: filterEmployee || undefined }
    });
    setPayrolls(res.data);
  };

  const viewPayslip = async (payrollId) => {
    const res = await api.get(`/payroll/payslip/${payrollId}`);
    setSelectedPayroll(res.data);
  };

  const downloadPayslip = async (payrollId, empName, month) => {
    setDownloadingId(payrollId);
    try {
      const res = await api.get(`/payroll/payslip/${payrollId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `payslip_${empName.replace(/ /g, '_')}_${month}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      setMessage('✅ Payslip downloaded!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Download failed. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setDownloadingId(null);
    }
  };

  const totalNetThisMonth = payrolls
    .filter(p => p.month_year === new Date().toISOString().slice(0, 7))
    .reduce((s, p) => s + Number(p.net_salary), 0);

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="page-title gradient-text">Payslips</h1>
          <p className="page-subtitle">View and download employee payslips</p>
        </div>
        <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} className="input-field w-52">
          <option value="">All Employees</option>
          {employees.map(e => <option key={e.employee_id} value={e.employee_id}>{e.name}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5">
        {[
          { label: 'Total Records', value: payrolls.length, emoji: '📄' },
          { label: 'Current Month Net', value: `₹${totalNetThisMonth.toLocaleString()}`, emoji: '💵' },
          { label: 'Payslips Available', value: payrolls.filter(p => p.status !== 'Generated').length, emoji: '✅' }
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className="text-3xl">{s.emoji}</span>
            <div>
              <p className="text-xl font-black text-gray-800 dark:text-white">{s.value}</p>
              <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium border ${
          message.startsWith('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>{message}</div>
      )}

      {/* Table + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table */}
        <div className="glass-card p-6 lg:col-span-2">
          <h2 className="text-base font-bold text-gray-800 dark:text-white mb-4">Payroll Records</h2>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Employee</th><th>Month</th><th>Net Salary</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {payrolls.map(p => (
                  <tr key={p.payroll_id} className={`transition-colors ${selectedPayroll?.payroll_id === p.payroll_id ? 'bg-indigo-50/50 dark:bg-indigo-900/40' : 'hover:bg-gray-50/50 dark:hover:bg-slate-900/30'}`}>
                    <td className="px-4 py-4"><span className="text-[10px] font-black text-indigo-500 uppercase">#{String(p.employee_id).padStart(3, '0')}</span></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-black text-sm shadow-sm">
                          {p.employee_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 dark:text-white text-sm">{p.employee_name}</p>
                          <p className="text-gray-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">{p.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-gray-600 dark:text-slate-400 font-semibold">{p.month_year}</td>
                    <td className="font-black text-gray-900 dark:text-white">₹{Number(p.net_salary).toLocaleString()}</td>
                    <td><span className={`badge ${statusColors[p.status] || 'badge-gray'}`}>{p.status}</span></td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => viewPayslip(p.payroll_id)}
                          className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-400 transition-all active:scale-95" title="View Preview">
                          <DocumentTextIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadPayslip(p.payroll_id, p.employee_name, p.month_year)}
                          disabled={downloadingId === p.payroll_id}
                          className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 transition-all active:scale-95 disabled:opacity-50" title="Download PDF">
                          {downloadingId === p.payroll_id
                            ? <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            : <DocumentArrowDownIcon className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payrolls.length === 0 && <p className="text-center text-gray-400 py-8">No payslips found. Generate payroll first.</p>}
          </div>
        </div>

        {/* Payslip Preview Panel */}
        <div className="glass-card p-6">
          <h2 className="text-base font-bold text-gray-800 dark:text-white mb-4">Payslip Preview</h2>
          {selectedPayroll ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-xl text-center">
                <p className="font-black text-lg">AdaptivePay</p>
                <p className="text-xs opacity-80">Payslip — {selectedPayroll.month_year}</p>
              </div>
              {/* Employee Info */}
              <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4 space-y-1.5 border border-transparent dark:border-slate-800">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-500">Name</span>
                  <span className="font-bold text-gray-800 dark:text-white">{selectedPayroll.employee_name} (#{String(selectedPayroll.employee_id).padStart(3, '0')})</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-500">Department</span>
                  <span className="font-semibold text-gray-700 dark:text-slate-300">{selectedPayroll.department}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-500">Role</span>
                  <span className="font-semibold text-gray-700 dark:text-slate-300">{selectedPayroll.role}</span>
                </div>
              </div>
              {/* Earnings */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Earnings</p>
                {[
                  { label: 'Base Salary', val: selectedPayroll.base_salary, color: 'text-gray-800 dark:text-slate-200' },
                  { label: 'Overtime', val: selectedPayroll.overtime_pay, color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Bonus', val: selectedPayroll.bonus, color: 'text-blue-600 dark:text-blue-400' }
                ].map(i => (
                  <div key={i.label} className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-slate-500">{i.label}</span>
                    <span className={`font-semibold ${i.color}`}>₹{Number(i.val).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              {/* Deductions */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-red-500 uppercase tracking-wider">Deductions</p>
                {[
                  { label: 'Leave Deduction', val: selectedPayroll.leave_deduction },
                  { label: 'Tax Deduction', val: selectedPayroll.tax_deduction }
                ].map(i => (
                  <div key={i.label} className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-slate-500">{i.label}</span>
                    <span className="font-semibold text-red-500 dark:text-red-400">-₹{Number(i.val).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              {/* Net */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border border-indigo-200 dark:border-indigo-900 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-700 dark:text-slate-300">NET SALARY</span>
                  <span className="text-xl font-black text-indigo-700 dark:text-indigo-400">₹{Number(selectedPayroll.net_salary).toLocaleString()}</span>
                </div>
              </div>
              <button
                onClick={() => downloadPayslip(selectedPayroll.payroll_id, selectedPayroll.employee_name, selectedPayroll.month_year)}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                <DocumentArrowDownIcon className="w-4 h-4" /> Download PDF
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <DocumentTextIcon className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-400 text-sm">Click View on any payroll record<br/>to preview the payslip here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payslips;
