import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { 
  UserPlusIcon, TrashIcon, PencilSquareIcon, 
  MagnifyingGlassIcon, FunnelIcon, XMarkIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDept, setSelectedDept] = useState('All Departments');
    
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', department: 'Engineering', role: 'Engineer', base_salary: '', joining_date: ''
    });

    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/employees/', {
                params: { search: searchQuery, department: selectedDept }
            });
            setEmployees(res.data);
        } catch (error) {
            console.error("Error fetching employees:", error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, selectedDept]);

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/employees/departments');
            setDepartments(['All Departments', ...res.data]);
        } catch (error) {
            console.error("Error fetching departments:", error);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchEmployees();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchEmployees]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value});

    const openModal = (emp = null) => {
        if (emp) {
            setFormData({
                name: emp.name,
                email: emp.email,
                phone: emp.phone,
                department: emp.department,
                role: emp.role,
                base_salary: emp.base_salary,
                joining_date: emp.joining_date
            });
            setIsEditing(true);
            setCurrentId(emp.employee_id);
        } else {
            setFormData({
                name: '', email: '', phone: '', department: 'Engineering', role: 'Engineer', base_salary: '', joining_date: ''
            });
            setIsEditing(false);
            setCurrentId(null);
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/employees/${currentId}`, formData);
            } else {
                await api.post('/employees/', formData);
            }
            setShowModal(false);
            fetchEmployees();
            fetchDepartments();
        } catch (error) {
            alert("Error saving employee details.");
        }
    };

    const handleDelete = async (id) => {
        if(window.confirm("Are you sure you want to mark this employee as Inactive?")) {
            try {
                await api.delete(`/employees/${id}`);
                fetchEmployees();
            } catch (error) {
                alert("Error deleting employee.");
            }
        }
    }

    return (
        <div className="space-y-10 animate-zoho-fade">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="page-title">Employee Registry</h1>
                    <p className="page-subtitle">Centralized database for workforce records and organizational structure.</p>
                </div>
                <button 
                    onClick={() => openModal()}
                    className="btn-primary flex items-center gap-2 self-start"
                >
                    <UserPlusIcon className="w-5 h-5" />
                    <span>Onboard Employee</span>
                </button>
            </div>
            
            {/* Filters & Search */}
            <div className="glass-card p-6 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Search by name, email or role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field pl-14 h-12"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <FunnelIcon className="w-5 h-5 text-slate-400 hidden md:block" />
                    <select 
                        className="input-field h-12 min-w-[200px]"
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                    >
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Employee Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-8 py-5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">ID</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Employee Profile</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Designation</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Base Remuneration</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Joining Date</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Settings</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {employees.map(emp => (
                                <tr key={emp.employee_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all duration-200">
                                    <td className="px-8 py-6">
                                        <span className="text-xs font-black text-[#0067ff] bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-md">
                                            #{String(emp.employee_id).padStart(3, '0')}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-[#0067ff]/10 flex items-center justify-center text-[#0067ff] font-black text-lg shadow-inner">
                                                {emp.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-[#0c1e3e] dark:text-white leading-tight">{emp.name}</p>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-1 tracking-wide">{emp.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="font-bold text-slate-700 dark:text-slate-300">{emp.role}</p>
                                        <p className="text-xs text-[#0067ff] font-black uppercase mt-1 tracking-wider">{emp.department}</p>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className="font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-sm transition-colors">
                                            ₹{parseFloat(emp.base_salary).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                            {emp.joining_date ? new Date(emp.joining_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                        </p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${emp.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500'}`} />
                                            <span className={`text-xs font-black uppercase ${emp.status === 'Active' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                {emp.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => openModal(emp)}
                                                className="p-2.5 text-slate-400 hover:text-[#0067ff] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                                                title="Edit Profile"
                                            >
                                                <PencilSquareIcon className="w-5 h-5"/>
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(emp.employee_id)}
                                                className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                                title="Inactivate"
                                            >
                                                <TrashIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && employees.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center opacity-30">
                                            <UsersIcon className="w-16 h-16 mb-4 text-slate-300" />
                                            <p className="text-lg font-black text-slate-400">No organizational records found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-[#0c1e3e]/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-zoho-fade border border-transparent dark:border-slate-800">
                        <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-900/50">
                            <div>
                                <h2 className="text-2xl font-black text-[#0c1e3e] dark:text-white tracking-tight">
                                    {isEditing ? 'Modify Personnel Record' : 'Onboard New Personnel'}
                                </h2>
                                <p className="text-xs text-slate-400 font-bold mt-1 tracking-wider uppercase">Administrative Control</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <XMarkIcon className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Full Legal Name</label>
                                    <input required type="text" name="name" onChange={handleChange} value={formData.name} className="input-field" placeholder="e.g. Alexander Pierce" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Corporate Email</label>
                                    <input required type="email" name="email" onChange={handleChange} value={formData.email} className="input-field" placeholder="alex@company.com" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Primary Phone</label>
                                    <input required type="text" name="phone" onChange={handleChange} value={formData.phone} className="input-field" placeholder="+91 98765 43210" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Annual Compensation</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                        <input required type="number" name="base_salary" onChange={handleChange} value={formData.base_salary} className="input-field pl-8" placeholder="950000" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Organizational Unit</label>
                                    <select name="department" onChange={handleChange} value={formData.department} className="input-field">
                                        <option>Engineering</option>
                                        <option>HR</option>
                                        <option>Sales</option>
                                        <option>Marketing</option>
                                        <option>Finance</option>
                                        <option>Operations</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Job Designation</label>
                                    <input required type="text" name="role" onChange={handleChange} value={formData.role} className="input-field" placeholder="e.g. Senior Architect" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Date of Onboarding</label>
                                    <input required type="date" name="joining_date" onChange={handleChange} value={formData.joining_date} className="input-field" />
                                </div>
                            </div>
                            <div className="pt-8 flex justify-end gap-4 border-t border-slate-100 dark:border-slate-800">
                                <button type="button" onClick={() => setShowModal(false)} className="text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors px-4">Dismiss</button>
                                <button type="submit" className="btn-primary min-w-[200px]">
                                    {isEditing ? 'Commit Changes' : 'Confirm Onboarding'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employees;
