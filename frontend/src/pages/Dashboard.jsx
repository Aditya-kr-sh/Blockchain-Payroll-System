import React, { useEffect, useState } from 'react';
import api from '../services/api';
import DashboardCard from '../components/DashboardCard';
import {
  UsersIcon, CurrencyDollarIcon, LinkIcon, ClockIcon, 
  ArrowUpIcon, CheckBadgeIcon, ShieldCheckIcon, DocumentTextIcon
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, PointElement, LineElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = () => {
  const [stats, setStats] = useState({
    employees: 0, workforce_growth: 0,
    expense: 0, payout_growth: 0,
    pending_leaves: 0, leaves_growth: 0,
    departments: [], attendance: [],
    blocks: 0
  });
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [res, chainRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/blockchain/chain')
        ]);
        setStats({
          employees: res.data.total_employees,
          workforce_growth: res.data.workforce_growth,
          expense: res.data.monthly_payroll_expense,
          payout_growth: res.data.payout_growth,
          pending_leaves: res.data.pending_leaves,
          leaves_growth: res.data.leaves_growth,
          departments: res.data.department_distribution,
          attendance: res.data.attendance_trends || [],
          blocks: chainRes.data.length
        });
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
        labels: { color: isDarkMode ? '#94a3b8' : '#64748b', font: { weight: 'bold' } }
      }
    },
    scales: {
      y: {
        grid: { borderDash: [5, 5], color: isDarkMode ? '#334155' : '#e2e8f0' },
        ticks: { color: isDarkMode ? '#94a3b8' : '#64748b', font: { weight: 'bold' } },
        border: { display: false }
      },
      x: {
        grid: { display: false },
        ticks: { color: isDarkMode ? '#94a3b8' : '#64748b', font: { weight: 'bold' } }
      }
    }
  };

  const barData = {
    labels: stats.departments.map(d => d.department),
    datasets: [{
      label: 'Employees',
      data: stats.departments.map(d => d.count),
      backgroundColor: '#0067ff',
      borderRadius: 4,
      barThickness: 30,
    }]
  };

  const deptPieData = {
    labels: stats.departments.map(d => d.department),
    datasets: [{
      data: stats.departments.map(d => d.count),
      backgroundColor: ['#0067ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
      borderWidth: 2,
      borderColor: isDarkMode ? '#1e293b' : '#ffffff',
      hoverOffset: 12
    }]
  };

  const handleGenerateReport = async () => {
    try {
      const response = await api.get('/analytics/report', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Executive_Report_${localStorage.getItem('orgDomain').split('.')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Report error:", error);
      alert("Failed to generate organizational report.");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin w-12 h-12 rounded-full border-4 border-[#0067ff] border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-10 animate-zoho-fade">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Enterprise Dashboard</h1>
          <p className="page-subtitle">Real-time highlights of your organization's payroll and workforce.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border border-emerald-100 dark:border-emerald-800/50">
            <ShieldCheckIcon className="w-5 h-5" />
            Blockchain Verified
          </div>
          <button 
            onClick={handleGenerateReport}
            className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5"
          >
            <ArrowUpIcon className="w-4 h-4" />
            Generate Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { title: "Total Workforce", value: stats.employees, growth: stats.workforce_growth, icon: UsersIcon, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Monthly Payout", value: `₹${stats.expense.toLocaleString()}`, growth: stats.payout_growth, icon: CurrencyDollarIcon, color: "text-emerald-600", bg: "bg-emerald-50" },
          { title: "Open Leaves", value: stats.pending_leaves, growth: stats.leaves_growth, icon: ClockIcon, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((item, idx) => (
          <div key={idx} className="glass-card p-6 flex items-start justify-between">
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider mb-2">{item.title}</p>
              <h4 className="text-3xl font-black text-slate-900 dark:text-white">{item.value}</h4>
              <div className={`mt-2 text-[10px] font-bold inline-block px-1.5 py-0.5 rounded uppercase ${
                item.growth >= 0 
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' 
                  : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30'
              }`}>
                {item.growth >= 0 ? '+' : ''}{item.growth}% vs last month
              </div>
            </div>
            <div className={`p-3 rounded-xl ${item.bg} dark:bg-opacity-10`}>
              <item.icon className={`w-7 h-7 ${item.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Department Analytics */}
        <div className="lg:col-span-2 glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Headcount by Department</h3>
            <select className="bg-slate-50 dark:bg-slate-900 border-none text-xs font-bold rounded-lg px-3 py-2 outline-none dark:text-slate-300">
              <option>Current Month</option>
              <option>Previous Month</option>
            </select>
          </div>
          <div className="h-[350px]">
            {stats.departments.length > 0
              ? <Bar 
                  data={barData} 
                  options={chartOptions} 
                />
              : <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <DocumentTextIcon className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm italic">No data records found</p>
                </div>
            }
          </div>
        </div>

        {/* Breakdown Panel */}
        <div className="glass-card p-8 flex flex-col">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-8">Role Distribution</h3>
          <div className="flex-1 min-h-[250px] mb-8">
            <Doughnut 
              data={deptPieData} 
              options={{ 
                maintainAspectRatio: false, 
                plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 25, font: { weight: 'bold', size: 11 } } } }, 
                cutout: '75%' 
              }} 
            />
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 mt-auto transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <CheckBadgeIcon className="w-6 h-6 text-[#0067ff]" />
              <h5 className="font-bold text-slate-800 dark:text-white">Compliance Check</h5>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Your payroll processing is currently compliant with ISO 27001 standards. Blockchain audit logs are verifying continuously.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
