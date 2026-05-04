import React from 'react';
import { NavLink } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col py-6 px-4 docked h-screen border-r w-64 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950 font-['Inter'] antialiased z-50">
      <div className="flex items-center gap-md mb-8 px-2">
        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600">
          <span className="material-symbols-outlined" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>psychiatry</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-violet-600 dark:text-violet-400">AI Concierge</h2>
          <p className="text-xs text-slate-500">Violet Trust System</p>
        </div>
      </div>
      
      <button className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white rounded-lg py-2.5 px-4 font-semibold hover:bg-violet-700 active:scale-95 duration-200 shadow-sm mb-6">
        <span className="material-symbols-outlined text-sm">add</span>
        New Conversation
      </button>
      
      <nav className="flex-1 flex flex-col gap-1">
        <NavLink
          to="/chat"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition-all active:scale-95 duration-200 ${
              isActive
                ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-r-4 border-violet-600'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`
          }
        >
          <span className="material-symbols-outlined">chat</span>
          Chat
        </NavLink>
        
        <NavLink
          to="/knowledge-base"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition-all active:scale-95 duration-200 ${
              isActive
                ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-r-4 border-violet-600'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`
          }
        >
          <span className="material-symbols-outlined">database</span>
          Knowledge Base
        </NavLink>
        
        <NavLink
          to="/integrations"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition-all active:scale-95 duration-200 ${
              isActive
                ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-r-4 border-violet-600'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`
          }
        >
          <span className="material-symbols-outlined">extension</span>
          Integrations
        </NavLink>
        
        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition-all active:scale-95 duration-200 ${
              isActive
                ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-r-4 border-violet-600'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`
          }
        >
          <span className="material-symbols-outlined">bar_chart</span>
          Analytics
        </NavLink>
      </nav>
      
      <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-1">
        <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all active:scale-95 duration-200 cursor-pointer">
          <span className="material-symbols-outlined">help</span>
          Help
        </a>
        <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all active:scale-95 duration-200 cursor-pointer">
          <span className="material-symbols-outlined">settings</span>
          Settings
        </a>
      </div>
    </aside>
  );
};
