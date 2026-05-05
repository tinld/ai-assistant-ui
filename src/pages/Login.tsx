import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { api, ApiError } from '../services/api';
import { setCredentials } from '../store/authSlice';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post<{ success: boolean; access_token: string; refresh_token?: string; user: any }>('/api/auth/login', {
        email,
        password,
      });

      if (response.success && response.access_token) {
        dispatch(setCredentials({
          user: response.user || { id: 'unknown', email },
          access_token: response.access_token,
        }));
        navigate('/chat');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message || 'Invalid email or password.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2 dark:text-slate-100">Welcome Back</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Sign in to continue to your AI assistant</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
          <span className="material-symbols-outlined text-base">error</span>
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 dark:text-slate-300" htmlFor="email">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-400 text-sm">mail</span>
            </div>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white/50 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all shadow-sm outline-none placeholder:text-slate-400 dark:bg-slate-800/50 dark:border-slate-700 dark:text-white"
              placeholder="you@example.com"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="password">
              Password
            </label>
            <a href="#" className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors dark:text-violet-400 dark:hover:text-violet-300">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-400 text-sm">lock</span>
            </div>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white/50 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all shadow-sm outline-none placeholder:text-slate-400 dark:bg-slate-800/50 dark:border-slate-700 dark:text-white"
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md shadow-violet-200 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed dark:shadow-none"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Signing in...</span>
            </div>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-violet-600 hover:text-violet-700 transition-colors hover:underline dark:text-violet-400 dark:hover:text-violet-300">
          Create an account
        </Link>
      </div>
    </div>
  );
};
