import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebar } from '../../store/appSlice';
import type { RootState, AppDispatch } from '../../store';

export const Sidebar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const isSidebarOpen = useSelector((state: RootState) => state.app.isSidebarOpen);

  const handleNewConversation = () => {
    navigate('/chat');
  };

  return (
    <aside className={`fixed left-0 top-0 h-full flex flex-col py-6 px-4 docked h-screen border-r border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950 font-['Inter'] antialiased z-50 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
      <button 
        onClick={() => dispatch(toggleSidebar())} 
        className="absolute -right-3.5 top-10 w-7 h-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400 z-50 shadow-sm transition-all hover:scale-110"
        title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
      >
        <span className="material-symbols-outlined text-[18px]">{isSidebarOpen ? 'chevron_left' : 'chevron_right'}</span>
      </button>

      <div className={`flex items-center mb-8 px-2 ${isSidebarOpen ? 'gap-md' : 'justify-center'}`}>
        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 flex-shrink-0">
          <span className="material-symbols-outlined" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>psychiatry</span>
        </div>
        {isSidebarOpen && (
          <div className="overflow-hidden whitespace-nowrap">
            <h2 className="text-lg font-bold text-violet-600 dark:text-violet-400">AI Concierge</h2>
            <p className="text-xs text-slate-500">Violet Trust System</p>
          </div>
        )}
      </div>
      
      <button 
        className={`flex items-center justify-center gap-2 bg-violet-600 text-white rounded-lg py-2.5 font-semibold hover:bg-violet-700 active:scale-95 duration-200 shadow-sm mb-6 ${isSidebarOpen ? 'w-full px-4' : 'w-12 h-12 mx-auto rounded-full'}`}
        onClick={handleNewConversation}
        title="New Conversation"
      >
        <span className="material-symbols-outlined text-sm">add</span>
        {isSidebarOpen && <span className="whitespace-nowrap">New Conversation</span>}
      </button>
      
      <nav className="flex-1 flex flex-col gap-1">
        <NavLink
          to="/chat"
          className={({ isActive }) =>
            `flex items-center px-3 py-2.5 rounded-lg font-semibold transition-all active:scale-95 duration-200 ${
              isActive
                ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-r-4 border-violet-600'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
            } ${isSidebarOpen ? 'gap-3' : 'justify-center'}`
          }
          title="Chat"
        >
          <span className="material-symbols-outlined">chat</span>
          {isSidebarOpen && <span>Chat</span>}
        </NavLink>
        
        <NavLink
          to="/knowledge-base"
          className={({ isActive }) =>
            `flex items-center px-3 py-2.5 rounded-lg font-semibold transition-all active:scale-95 duration-200 ${
              isActive
                ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-r-4 border-violet-600'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
            } ${isSidebarOpen ? 'gap-3' : 'justify-center'}`
          }
          title="Knowledge Base"
        >
          <span className="material-symbols-outlined">database</span>
          {isSidebarOpen && <span className="whitespace-nowrap">Knowledge Base</span>}
        </NavLink>
        
        <NavLink
          to="/files"
          className={({ isActive }) =>
            `flex items-center px-3 py-2.5 rounded-lg font-semibold transition-all active:scale-95 duration-200 ${
              isActive
                ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-r-4 border-violet-600'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
            } ${isSidebarOpen ? 'gap-3' : 'justify-center'}`
          }
          title="File Manager"
        >
          <span className="material-symbols-outlined">folder</span>
          {isSidebarOpen && <span className="whitespace-nowrap">File Manager</span>}
        </NavLink>
        
        <NavLink
          to="/integrations"
          className={({ isActive }) =>
            `flex items-center px-3 py-2.5 rounded-lg font-semibold transition-all active:scale-95 duration-200 ${
              isActive
                ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-r-4 border-violet-600'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
            } ${isSidebarOpen ? 'gap-3' : 'justify-center'}`
          }
          title="Integrations"
        >
          <span className="material-symbols-outlined">extension</span>
          {isSidebarOpen && <span>Integrations</span>}
        </NavLink>
        
        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            `flex items-center px-3 py-2.5 rounded-lg font-semibold transition-all active:scale-95 duration-200 ${
              isActive
                ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-r-4 border-violet-600'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
            } ${isSidebarOpen ? 'gap-3' : 'justify-center'}`
          }
          title="Analytics"
        >
          <span className="material-symbols-outlined">bar_chart</span>
          {isSidebarOpen && <span>Analytics</span>}
        </NavLink>
      </nav>
      
      <div className={`mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-1`}>
        <a className={`flex items-center px-3 py-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all active:scale-95 duration-200 cursor-pointer ${isSidebarOpen ? 'gap-3' : 'justify-center'}`} title="Help">
          <span className="material-symbols-outlined">help</span>
          {isSidebarOpen && <span>Help</span>}
        </a>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center px-3 py-2.5 rounded-lg font-semibold transition-all active:scale-95 duration-200 cursor-pointer ${
              isActive
                ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-r-4 border-violet-600'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
            } ${isSidebarOpen ? 'gap-3' : 'justify-center'}`
          }
          title="Settings"
        >
          <span className="material-symbols-outlined">settings</span>
          {isSidebarOpen && <span>Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
};
