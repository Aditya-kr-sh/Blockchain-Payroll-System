import React, { useState, useEffect } from 'react';
import { SunIcon, MoonIcon, CheckCircleIcon, ShieldCheckIcon, UserGroupIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import api from '../services/api';

const Login = ({ onAdminLogin, onEmployeeLogin }) => {
  const [loginType, setLoginType] = useState('admin'); // 'admin' or 'employee'
  const [isRegistering, setIsRegistering] = useState(false); // only for admin
  const [name, setName] = useState(''); // for admin register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
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

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (isRegistering && loginType === 'admin') {
        const response = await api.post('/auth/register', {
          email: email,
          password: password,
          role: 'Admin'
        });
        if (response.status === 201) {
          setSuccess(`Admin account created for ${response.data.org_domain}! You can now log in.`);
          setIsRegistering(false);
          setPassword('');
        }
      } else {
        const response = await api.post('/auth/login', {
          email: email,
          password: password
        });
        
        if (response.status === 200) {
          const user = response.data.user;
          const isManagerRole = ['Admin', 'HR', 'Manager'].includes(user.role);
          
          // Strict Role Check
          if (loginType === 'admin' && !isManagerRole) {
            setError('Access Denied: This portal is for Management & HR only.');
            setIsLoading(false);
            return;
          }
          if (loginType === 'employee' && isManagerRole) {
            setError('Access Denied: Please use the Management & HR portal.');
            setIsLoading(false);
            return;
          }

          localStorage.setItem('token', response.data.access_token);
          localStorage.setItem('orgDomain', user.org_domain);
          localStorage.setItem('userId', user.id);
          localStorage.setItem('userRole', user.role);
          localStorage.setItem('userName', user.email.split('@')[0]);
          
          if (isManagerRole) {
             localStorage.setItem('isAdmin', 'true');
             localStorage.removeItem('isEmployee');
             onAdminLogin();
          } else {
             localStorage.setItem('isEmployee', 'true');
             localStorage.removeItem('isAdmin');
             onEmployeeLogin(user.id);
          }
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Auth system encountered an error.');
    } finally {
      setIsLoading(false);
    }
  };

  const bgImage = loginType === 'admin' ? "/admin-bg.png" : "/employee-bg.png";

  return (
    <div 
      className="min-h-screen relative overflow-hidden bg-white dark:bg-hr-darkBg transition-colors duration-500 font-sans no-cursor"
      onMouseMove={handleMouseMove}
    >
      {/* Dynamic Background Image Layer - The "Subtle Blur" Base */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.25] dark:opacity-[0.2] pointer-events-none blur-[2px] scale-105"
        style={{ backgroundImage: `url(${bgImage})` }}
      ></div>

      {/* The "Spotlight" Clear Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60 dark:opacity-80 pointer-events-none transition-opacity duration-700"
        style={{ 
          backgroundImage: `url(${bgImage})`,
          maskImage: `radial-gradient(circle 320px at ${mousePos.x}px ${mousePos.y}px, black, transparent)`,
          WebkitMaskImage: `radial-gradient(circle 320px at ${mousePos.x}px ${mousePos.y}px, black, transparent)`
        }}
      ></div>

      {/* Stylized Attractive Arrow Cursor */}
      <div 
        className="fixed pointer-events-none z-[9999] mix-blend-difference transition-transform duration-75 ease-out"
        style={{ 
          left: `${mousePos.x}px`, 
          top: `${mousePos.y}px`,
          transform: `translate(-2px, -2px)`
        }}
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="text-hr-coral drop-shadow-[0_0_8px_rgba(229,107,85,0.6)]"
        >
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" fill="currentColor" fillOpacity="0.2" />
          <path d="M13 13l6 6" />
        </svg>
      </div>

      {/* Decorative Blobs */}
      <div className="absolute -bottom-[20%] right-[-10%] w-[60%] h-[80%] bg-hr-yellow/30 dark:bg-hr-yellow/10 rounded-[100%] blur-[100px] animate-blob" style={{ animationDelay: '0s' }}></div>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-hr-coral/10 dark:bg-hr-coral/5 rounded-[100%] blur-[120px] animate-blob" style={{ animationDelay: '2s' }}></div>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <button 
          onClick={toggleTheme} 
          className="p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full shadow-lg border border-gray-100 dark:border-slate-700 text-hr-green dark:text-yellow-400 hover:scale-110 transition-transform duration-300 flex items-center justify-center cursor-pointer"
        >
          {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
        </button>
      </div>

      <div className="relative z-10 max-w-[1280px] mx-auto min-h-screen flex flex-col lg:flex-row items-center justify-between p-6 lg:p-12 gap-12">
        
        {/* Left Side: Branding */}
        <div className="flex-1 lg:pr-12 w-full pt-20 lg:pt-0 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-10 group cursor-default">
            <div className="w-12 h-12 bg-hr-green rounded-xl rotate-3 flex items-center justify-center text-white font-black text-2xl shadow-xl group-hover:rotate-6 transition-transform">
              AP
            </div>
            <span className="text-3xl font-black text-hr-green dark:text-white tracking-tight">AdaptivePay</span>
          </div>
          
          <h1 className="text-[3rem] lg:text-[4rem] font-black text-hr-coral mb-6 leading-[1.1] tracking-tight">
            Payroll Architecture<br/>for the Modern Enterprise
          </h1>
          
          <p className="text-2xl lg:text-3xl font-black text-hr-green dark:text-gray-200 mb-10 leading-tight max-w-2xl">
            A unified system providing cryptographic audit trails and seamless payout orchestration.
          </p>
          
          <div className="space-y-5 mb-12">
            {[
              "Automated continuous compliance verification.",
              "Smart contract governed disbursement protocols.",
              "Transparent self-service employee access."
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <CheckCircleIcon className="w-7 h-7 text-hr-coral group-hover:scale-110 transition-transform" />
                <span className="text-lg font-bold text-gray-700 dark:text-gray-300">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-[480px] flex-shrink-0 relative mt-10 lg:mt-0">
          <div className="absolute top-[10%] xl:top-[20%] right-[-10%] xl:right-[-30%] w-[120%] xl:w-[150%] h-[120%] bg-hr-yellow/40 dark:bg-yellow-500/10 rounded-[4rem] rotate-12 -z-10 animate-float blur-[2px]"></div>
          
          <div className="bg-white/90 dark:bg-hr-darkCard/90 backdrop-blur-2xl rounded-[3rem] p-8 lg:p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] animate-slide-in border border-white/50 dark:border-white/10">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-hr-green to-hr-coral"></div>
            
            <h2 className="text-3xl font-black text-gray-900 dark:text-white text-center mb-8 tracking-tight">
              {isRegistering ? 'Admin Registration' : 'Access Portal'}
            </h2>

            {/* Tabs */}
            <div className="flex p-1 bg-gray-100/50 dark:bg-slate-900/50 rounded-2xl mb-8 border border-gray-200 dark:border-white/5">
              <button
                type="button"
                onClick={() => { setLoginType('admin'); setError(''); setIsRegistering(false); }}
                className={`flex-1 flex justify-center items-center gap-2 py-3.5 text-sm font-bold rounded-xl transition-all ${
                  loginType === 'admin' 
                    ? 'text-hr-green dark:text-hr-darkBg shadow-md bg-white dark:bg-hr-yellow' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                } cursor-pointer`}
              >
                <ShieldCheckIcon className="w-5 h-5" />
                Management & HR
              </button>
              <button
                type="button"
                onClick={() => { setLoginType('employee'); setError(''); setIsRegistering(false); }}
                className={`flex-1 flex justify-center items-center gap-2 py-3.5 text-sm font-bold rounded-xl transition-all ${
                  loginType === 'employee' 
                    ? 'text-hr-green dark:text-hr-darkBg shadow-md bg-white dark:bg-hr-yellow' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                } cursor-pointer`}
              >
                <UserGroupIcon className="w-5 h-5" />
                Employee
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isRegistering && loginType === 'admin' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 px-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-gray-900 dark:text-white font-medium focus:bg-white dark:focus:bg-black focus:ring-4 focus:ring-hr-coral/10 focus:border-hr-coral outline-none transition-all cursor-text"
                    placeholder="Enter your name"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 px-1">System Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-gray-900 dark:text-white font-medium focus:bg-white dark:focus:bg-black focus:ring-4 focus:ring-hr-coral/10 focus:border-hr-coral outline-none transition-all cursor-text"
                  placeholder={loginType === 'admin' ? "manager/hr/admin@company.com" : "employee@company.com"}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 px-1">
                  {loginType === 'admin' ? 'Security Password' : 'Employee ID PIN'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-gray-900 dark:text-white font-medium focus:bg-white dark:focus:bg-black focus:ring-4 focus:ring-hr-coral/10 focus:border-hr-coral outline-none transition-all cursor-text pr-14"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-hr-coral transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold p-4 rounded-xl">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold p-4 rounded-xl">
                  {success}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-hr-green hover:bg-[#0a4638] text-white dark:text-hr-darkBg dark:bg-hr-yellow dark:hover:bg-yellow-400 px-8 py-4 rounded-2xl font-black shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex justify-center items-center mt-6 disabled:opacity-70 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  isRegistering ? 'Create Admin Account' : 'Authenticate Access'
                )}
              </button>

              {loginType === 'admin' && (
                <div className="pt-4 text-center">
                  <button 
                    type="button"
                    onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccess(''); }}
                    className="text-sm font-bold text-hr-green dark:text-teal-400 hover:underline cursor-pointer"
                  >
                    {isRegistering ? 'Already have an account? Log in' : 'New Admin? Register here'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
