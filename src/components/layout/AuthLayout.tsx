import React from 'react';
import { Outlet } from 'react-router-dom';
import { BrandMark } from '../BrandMark';

export const AuthLayout: React.FC = () => {
  return (
    <div className="relative z-0 flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#eef6ff_46%,#f6f2ff_100%)] p-4 font-['Inter'] antialiased dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_48%,#111827_100%)]">
      <div className="absolute inset-0 z-[-1] bg-[radial-gradient(circle_at_18%_18%,rgba(14,165,233,0.12),transparent_28%),radial-gradient(circle_at_84%_12%,rgba(168,85,247,0.13),transparent_30%),linear-gradient(rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:auto,auto,44px_44px,44px_44px] dark:bg-[radial-gradient(circle_at_18%_18%,rgba(14,165,233,0.16),transparent_28%),radial-gradient(circle_at_84%_12%,rgba(168,85,247,0.14),transparent_30%),linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)]"></div>
      
      <main className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-md">
            <BrandMark size="lg" />
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Nexa AI</h2>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Intelligent operating space</p>
            </div>
          </div>
        </div>

        <div className="glass-effect relative overflow-hidden rounded-2xl border border-white/60 bg-white/76 p-8 shadow-[0_28px_80px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/78">
           {/* Ambient top light */}
           <div className="absolute left-1/2 top-0 h-1 w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-60"></div>
           <Outlet />
        </div>
      </main>
    </div>
  );
};
