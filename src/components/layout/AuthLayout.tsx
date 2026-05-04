import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-slate-50 to-violet-100 flex items-center justify-center p-4 relative overflow-hidden font-['Inter'] antialiased z-0">
      {/* Decorative background circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-violet-200/50 blur-3xl z-[-1]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] rounded-full bg-blue-200/50 blur-3xl z-[-1]"></div>
      
      <main className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-md">
            <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-200">
              <span className="material-symbols-outlined text-2xl" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>psychiatry</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">AI Concierge</h2>
              <p className="text-sm text-slate-500 font-medium">Violet Trust System</p>
            </div>
          </div>
        </div>

        <div className="glass-effect rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl bg-white/70 border border-white/50 p-8 relative">
           {/* Ambient top light */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-violet-400 to-transparent opacity-50"></div>
           <Outlet />
        </div>
      </main>
    </div>
  );
};
