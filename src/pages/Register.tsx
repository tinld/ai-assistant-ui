import React from 'react';
import { Link } from 'react-router-dom';

export const Register: React.FC = () => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Create an Account</h1>
        <p className="text-sm text-slate-500">Join the Violet Trust System today</p>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="name">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-400 text-sm">person</span>
            </div>
            <input
              type="text"
              id="name"
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white/50 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all shadow-sm outline-none placeholder:text-slate-400"
              placeholder="John Doe"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="email">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-400 text-sm">mail</span>
            </div>
            <input
              type="email"
              id="email"
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white/50 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all shadow-sm outline-none placeholder:text-slate-400"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-400 text-sm">lock</span>
            </div>
            <input
              type="password"
              id="password"
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white/50 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all shadow-sm outline-none placeholder:text-slate-400"
              placeholder="••••••••"
              required
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">Must be at least 8 characters long</p>
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md shadow-violet-200 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all active:scale-[0.98] mt-6"
        >
          Create Account
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-violet-600 hover:text-violet-700 transition-colors hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
};
