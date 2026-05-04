import React from 'react';
import { useLocation } from 'react-router-dom';

export const Header: React.FC = () => {
  const location = useLocation();
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/chat':
        return 'Chat';
      case '/knowledge-base':
        return 'Knowledge Base';
      case '/integrations':
        return 'Integrations';
      case '/analytics':
        return 'Analytics';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-8 ml-64 w-[calc(100%-16rem)] h-16 border-b border-slate-200 dark:border-slate-800 shadow-none bg-white/80 dark:bg-slate-950/80 backdrop-blur-md text-violet-600 dark:text-violet-400 font-['Inter'] text-sm">
      <div className="flex items-center gap-md font-bold text-lg">
        {getPageTitle()}
      </div>
      <div className="flex items-center gap-lg">
        <button className="text-slate-500 cursor-pointer transition-opacity opacity-100 hover:opacity-80 hover:text-violet-600 dark:hover:text-violet-400">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="text-slate-500 cursor-pointer transition-opacity opacity-100 hover:opacity-80 hover:text-violet-600 dark:hover:text-violet-400">
          <span className="material-symbols-outlined">contrast</span>
        </button>
        <button className="text-slate-500 cursor-pointer transition-opacity opacity-100 hover:opacity-80 hover:text-violet-600 dark:hover:text-violet-400">
          <span className="material-symbols-outlined">account_circle</span>
        </button>
      </div>
    </header>
  );
};
