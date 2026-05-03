import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

const TaxSlabs = () => {
  const [slabs, setSlabs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editSlab, setEditSlab] = useState(null);
  const [form, setForm] = useState({ min_salary: '', max_salary: '', tax_rate: '' });
  const [message, setMessage] = useState('');

  useEffect(() => { fetchSlabs(); }, []);

  const fetchSlabs = async () => {
    const res = await api.get('/tax/slabs');
    setSlabs(res.data);
  };

  const openAdd = () => {
    setEditSlab(null);
    setForm({ min_salary: '', max_salary: '', tax_rate: '' });
    setShowModal(true);
  };

  const openEdit = (slab) => {
    setEditSlab(slab);
    setForm({
      min_salary: slab.min_salary,
      max_salary: slab.max_salary ?? '',
      tax_rate: slab.tax_rate
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      min_salary: parseFloat(form.min_salary),
      max_salary: form.max_salary ? parseFloat(form.max_salary) : null,
      tax_rate: parseFloat(form.tax_rate)
    };
    if (editSlab) {
      await api.put(`/tax/slabs/${editSlab.slab_id}`, payload);
      showMsg('✅ Tax slab updated!');
    } else {
      await api.post('/tax/slabs', payload);
      showMsg('✅ Tax slab added!');
    }
    setShowModal(false);
    fetchSlabs();
  };

  const handleDelete = async (slabId) => {
    if (!window.confirm('Delete this tax slab?')) return;
    await api.delete(`/tax/slabs/${slabId}`);
    showMsg('Tax slab deleted.');
    fetchSlabs();
  };

  const showMsg = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const formatCurrency = (val) => {
    if (!val && val !== 0) return '∞';
    const n = Number(val);
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    return `₹${n.toLocaleString()}`;
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="page-title gradient-text">Tax Slab Configuration</h1>
          <p className="page-subtitle">Configure income tax slabs for payroll calculation</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Add Slab
        </button>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium">
          {message}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 border border-indigo-100 dark:border-slate-800 rounded-2xl p-5">
        <p className="text-sm text-indigo-700 dark:text-indigo-400 font-medium">
          💡 <strong>How it works:</strong> Tax is calculated progressively. Each slab rate applies only to the income 
          falling within that range. The net monthly tax is deducted from each employee's salary during payroll generation.
        </p>
      </div>

      {/* Tax Slabs Table */}
      <div className="glass-card p-6">
        <h2 className="text-base font-bold text-gray-800 mb-5">Current Tax Slabs</h2>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr className="dark:bg-slate-900/50"><th>#</th><th>Income Range (Annual)</th><th>Tax Rate</th><th>Effective on</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {slabs.map((s, i) => (
                <tr key={s.slab_id}>
                  <td className="text-gray-400 font-medium dark:text-slate-500">{i + 1}</td>
                  <td>
                    <div className="flex items-center gap-2">
                       <span className="font-semibold text-gray-800 dark:text-white">{formatCurrency(s.min_salary)}</span>
                       <span className="text-gray-400 dark:text-slate-600">—</span>
                       <span className="font-semibold text-gray-800 dark:text-white">{formatCurrency(s.max_salary)}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`text-lg font-black ${
                      Number(s.tax_rate) === 0 ? 'text-emerald-600'
                      : Number(s.tax_rate) <= 10 ? 'text-blue-600'
                      : Number(s.tax_rate) <= 20 ? 'text-amber-600'
                      : 'text-red-600'
                    }`}>{s.tax_rate}%</span>
                  </td>
                  <td className="text-gray-500 text-sm">
                    Salary between {formatCurrency(s.min_salary)} and {formatCurrency(s.max_salary)}
                  </td>
                  <td>
                    <div className="flex gap-1.5">
                      <button onClick={() => openEdit(s)}
                        className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-400 transition-colors">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(s.slab_id)}
                        className="p-1.5 rounded-lg bg-red-100 dark:bg-rose-900/40 hover:bg-red-200 dark:hover:bg-rose-900/60 text-red-600 dark:text-rose-400 transition-colors">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Chart */}
      <div className="glass-card p-6">
        <h2 className="text-base font-bold text-gray-800 mb-5">Tax Rate Visualization</h2>
        <div className="space-y-3">
          {slabs.map((s, i) => (
            <div key={s.slab_id} className="flex items-center gap-4">
              <div className="text-sm text-gray-500 dark:text-slate-400 w-40 flex-shrink-0 font-medium">
                {formatCurrency(s.min_salary)} – {formatCurrency(s.max_salary)}
              </div>
              <div className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-full h-7 relative overflow-hidden">
                <div
                  className={`h-full rounded-full flex items-center justify-end pr-3 transition-all duration-700 ${
                    Number(s.tax_rate) === 0 ? 'bg-emerald-400'
                    : Number(s.tax_rate) <= 10 ? 'bg-blue-400'
                    : Number(s.tax_rate) <= 20 ? 'bg-amber-400'
                    : 'bg-red-400'
                  }`}
                  style={{ width: `${Math.max(Number(s.tax_rate), 3)}%` }}>
                  <span className="text-white text-xs font-bold">{s.tax_rate}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box animate-fade-in-up">
            <h2 className="text-xl font-bold text-gray-800 mb-5">
              {editSlab ? 'Edit Tax Slab' : 'Add New Tax Slab'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Annual Salary (₹)</label>
                <input type="number" min="0" step="0.01" required className="input-field"
                  placeholder="e.g. 500000" value={form.min_salary}
                  onChange={e => setForm({ ...form, min_salary: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Annual Salary (₹) <span className="text-gray-400 text-xs">— leave blank for unlimited</span></label>
                <input type="number" min="0" step="0.01" className="input-field"
                  placeholder="e.g. 1000000 (or blank for ∞)" value={form.max_salary}
                  onChange={e => setForm({ ...form, max_salary: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                <input type="number" min="0" max="100" step="0.01" required className="input-field"
                  placeholder="e.g. 10" value={form.tax_rate}
                  onChange={e => setForm({ ...form, tax_rate: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">{editSlab ? 'Update' : 'Add'} Slab</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxSlabs;
