import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { api, ApiError } from '../services/api';
import { setCredentials } from '../store/authSlice';

export const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [touchedConfirm, setTouchedConfirm] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password: string) => {
    const re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
    return re.test(password);
  };

  const isEmailInvalid = touchedEmail && email.length > 0 && !validateEmail(email);
  const isPasswordInvalid = touchedPassword && password.length > 0 && !validatePassword(password);
  const isConfirmPasswordInvalid = touchedConfirm && confirmPassword.length > 0 && password !== confirmPassword;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    if (type === 'error') {
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTouchedEmail(true);
    setTouchedPassword(true);
    setTouchedConfirm(true);

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters long and contain at least one letter and one number.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post<{ success: boolean; access_token: string; refresh_token?: string; user: any }>('/api/auth/register', {
        email,
        password,
        full_name: fullName,
      });

      if (response.success) {
        showToast('Account created successfully! Please log in.', 'success');
        
        // Wait for 1.5 seconds so the user can see the nice success popup
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setError('Registration failed. Please try again.');
        showToast('Registration failed.', 'error');
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message || 'Registration failed. Email might already be in use.');
        showToast(err.message || 'Email might already be in use.', 'error');
      } else {
        setError('An unexpected error occurred. Please try again.');
        showToast('Network error. Please try again.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getInputClassName = (isInvalid: boolean) => {
    const baseClass = "block w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm bg-white/50 transition-all shadow-sm outline-none placeholder:text-slate-400 dark:bg-slate-800/50 dark:text-white";
    if (isInvalid) {
      return `${baseClass} border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:border-red-500`;
    }
    return `${baseClass} border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:border-slate-700`;
  };

  return (
    <>
      {/* Nice Notification Popup (Toast) */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300 ${
          toast.type === 'success' 
            ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
            : 'bg-red-500 text-white shadow-red-500/20'
        }`}>
          <span className="material-symbols-outlined text-xl">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <p className="font-semibold text-sm tracking-wide">{toast.message}</p>
        </div>
      )}

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-2 dark:text-slate-100">Create an Account</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Join the Violet Trust System today</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 dark:text-slate-300" htmlFor="name">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-400 text-sm">person</span>
              </div>
              <input
                type="text"
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={getInputClassName(false)}
                placeholder="John Doe"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-1.5 ${isEmailInvalid ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`} htmlFor="email">
              Email Address {isEmailInvalid && <span className="text-xs font-normal ml-1">(Invalid format)</span>}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className={`material-symbols-outlined text-sm ${isEmailInvalid ? 'text-red-400' : 'text-slate-400'}`}>mail</span>
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouchedEmail(true)}
                className={getInputClassName(isEmailInvalid)}
                placeholder="you@example.com"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-1.5 ${isPasswordInvalid ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`} htmlFor="password">
              Password {isPasswordInvalid && <span className="text-xs font-normal ml-1">(Too weak)</span>}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className={`material-symbols-outlined text-sm ${isPasswordInvalid ? 'text-red-400' : 'text-slate-400'}`}>lock</span>
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouchedPassword(true)}
                className={getInputClassName(isPasswordInvalid)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
            <p className={`mt-1.5 text-xs ${isPasswordInvalid ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
              Must be at least 6 characters with a letter and a number
            </p>
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-1.5 ${isConfirmPasswordInvalid ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`} htmlFor="confirmPassword">
              Confirm Password {isConfirmPasswordInvalid && <span className="text-xs font-normal ml-1">(Does not match)</span>}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className={`material-symbols-outlined text-sm ${isConfirmPasswordInvalid ? 'text-red-400' : 'text-slate-400'}`}>lock_reset</span>
              </div>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouchedConfirm(true)}
                className={getInputClassName(isConfirmPasswordInvalid)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md shadow-violet-200 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all active:scale-[0.98] mt-6 disabled:opacity-70 disabled:cursor-not-allowed dark:shadow-none"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Creating Account...</span>
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-violet-600 hover:text-violet-700 transition-colors hover:underline dark:text-violet-400 dark:hover:text-violet-300">
            Sign in
          </Link>
        </div>
      </div>
    </>
  );
};
