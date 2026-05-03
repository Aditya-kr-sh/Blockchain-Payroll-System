import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

const chartColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

const Analytics = () => {
  const [dashboard, setDashboard] = useState(null);
  const [payrollTrends, setPayrollTrends] = useState([]);
  const [deptSalary, setDeptSalary] = useState([]);
  const [leaveAnalytics, setLeaveAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const commonOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: isDarkMode ? '#94a3b8' : '#64748b',
          font: { weight: 'bold', size: 11 }
        }
      }
    },
    scales: isDarkMode ? {
      y: {
        grid: { color: '#334155' },
        ticks: { color: '#94a3b8' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' }
      }
    } : {}
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [dashRes, trendRes, deptRes, leaveRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/analytics/payroll-trends'),
          api.get('/analytics/department-salary'),
          api.get('/leaves/analytics')
        ]);
        setDashboard(dashRes.data);
        setPayrollTrends(trendRes.data);
        setDeptSalary(deptRes.data);
        setLeaveAnalytics(leaveRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent" />
    </div>
  );

  // Department Distribution Chart
  const deptDistData = {
    labels: dashboard?.department_distribution?.map(d => d.department) || [],
    datasets: [{
      label: 'Employees',
      data: dashboard?.department_distribution?.map(d => d.count) || [],
      backgroundColor: chartColors,
      borderWidth: 0
    }]
  };

  // Payroll Trends Line Chart
  const payrollLineData = {
    labels: payrollTrends.map(t => t.month_year),
    datasets: [
      {
        label: 'Total Net Salary',
        data: payrollTrends.map(t => parseFloat(t.total_net)),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Total Tax',
        data: payrollTrends.map(t => parseFloat(t.total_tax)),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Department Average Salary
  const deptSalaryData = {
    labels: deptSalary.map(d => d.department),
    datasets: [{
      label: 'Average Salary (₹)',
      data: deptSalary.map(d => parseFloat(d.avg_salary)),
      backgroundColor: chartColors.map(c => c + 'cc'),
      borderRadius: 8
    }]
  };

  // Leave Analytics
  const leavePieData = {
    labels: leaveAnalytics.map(l => l.leave_type),
    datasets: [{
      data: leaveAnalytics.map(l => l.total_requests),
      backgroundColor: chartColors,
      borderWidth: 0,
      hoverOffset: 6
    }]
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="page-title gradient-text">Analytics Dashboard</h1>
        <p className="page-subtitle">Comprehensive insights into your HR & payroll operations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Active Employees', value: dashboard?.total_employees ?? 0, color: 'from-indigo-500 to-purple-600', emoji: '👥' },
          { label: 'Monthly Expense', value: `₹${Number(dashboard?.monthly_payroll_expense ?? 0).toLocaleString()}`, color: 'from-emerald-500 to-teal-600', emoji: '💰' },
          { label: 'Pending Leaves', value: dashboard?.pending_leaves ?? 0, color: 'from-amber-500 to-orange-500', emoji: '📋' },
          { label: 'Payrolls This Month', value: dashboard?.total_payrolls_this_month ?? 0, color: 'from-blue-500 to-indigo-600', emoji: '📊' }
        ].map(k => (
          <div key={k.label} className={`bg-gradient-to-br ${k.color} rounded-2xl p-5 text-white shadow-lg`}>
            <div className="text-3xl mb-2">{k.emoji}</div>
            <p className="text-2xl font-black">{k.value}</p>
            <p className="text-sm opacity-80 font-medium">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-card">
          <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">Department Headcount</h3>
          <div className="h-60">
            {deptDistData.labels.length > 0
              ? <Pie data={deptDistData} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { ...commonOptions.plugins.legend, position: 'right' } } }} />
              : <p className="text-center text-gray-400 mt-16">No data available</p>}
          </div>
        </div>
        <div className="chart-card">
          <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">Leave Requests by Type</h3>
          <div className="h-60">
            {leavePieData.datasets[0].data.some(v => v > 0)
              ? <Pie data={leavePieData} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { ...commonOptions.plugins.legend, position: 'right' } } }} />
              : <p className="text-center text-gray-400 mt-16">No leave data yet</p>}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-card">
          <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">Payroll Trends (Last 12 Months)</h3>
          <div className="h-60">
            {payrollTrends.length > 0
              ? <Line data={payrollLineData} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { ...commonOptions.plugins.legend, position: 'bottom' } } }} />
              : <p className="text-center text-gray-400 mt-16">No payroll history yet</p>}
          </div>
        </div>
        <div className="chart-card">
          <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">Avg Salary by Department</h3>
          <div className="h-60">
            {deptSalaryData.labels.length > 0
              ? <Bar data={deptSalaryData} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { ...commonOptions.plugins.legend, display: false } } }} />
              : <p className="text-center text-gray-400 mt-16">No data</p>}
          </div>
        </div>
      </div>

      {/* Leave Details Table */}
      {leaveAnalytics.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">Leave Analytics by Type</h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Leave Type</th><th>Total Requests</th><th>Approved</th><th>Rejected</th><th>Pending</th><th>Approval Rate</th></tr>
              </thead>
              <tbody>
                {leaveAnalytics.map(l => {
                  const rate = l.total_requests > 0 ? Math.round((l.approved / l.total_requests) * 100) : 0;
                  return (
                    <tr key={l.leave_type}>
                      <td className="font-semibold text-gray-800 dark:text-gray-200">{l.leave_type}</td>
                      <td><span className="font-bold text-indigo-600 dark:text-indigo-400">{l.total_requests}</span></td>
                      <td><span className="font-bold text-emerald-600 dark:text-emerald-400">{l.approved}</span></td>
                      <td><span className="font-bold text-red-500 dark:text-red-400">{l.rejected}</span></td>
                      <td><span className="font-bold text-amber-500 dark:text-amber-400">{l.pending}</span></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${rate}%` }} />
                          </div>
                          <span className="text-xs font-bold text-gray-600 w-9">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
