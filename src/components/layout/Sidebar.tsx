import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  BarChart3,
  Bot,
  CircleHelp,
  FolderKanban,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { toggleSidebar } from '../../store/appSlice';
import type { RootState, AppDispatch } from '../../store';
import { APP_ROUTES } from '../../constants/route.constants';

export const Sidebar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isSidebarOpen = useSelector((state: RootState) => state.app.isSidebarOpen);

  const navItems = [
    { to: APP_ROUTES.chat, label: 'Chat', title: 'Chat', icon: Bot },
    { to: APP_ROUTES.agents, label: 'AI Agents', title: 'AI Agents', icon: UsersRound },
    { to: APP_ROUTES.files, label: 'File Manager', title: 'Intelligent File Manager', icon: FolderKanban },
    { to: APP_ROUTES.integrations, label: 'Integrations', title: 'Integrations', icon: Network },
    { to: APP_ROUTES.analytics, label: 'Analytics', title: 'Analytics', icon: BarChart3 },
  ];

  return (
    <aside className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-white/70 bg-white/84 px-4 py-5 font-['Inter'] shadow-[12px_0_45px_rgba(15,23,42,0.08)] backdrop-blur-xl antialiased transition-all duration-300 dark:border-slate-800/80 dark:bg-slate-950/86 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
      <button 
        onClick={() => dispatch(toggleSidebar())} 
        className="absolute -right-3.5 top-9 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-md transition-all hover:scale-105 hover:border-violet-300 hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-violet-700 dark:hover:text-violet-300"
        title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        type="button"
      >
        {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
      </button>

      <div className={`mb-7 flex items-center px-1 ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
        <div className="agent-logo-mark h-11 w-11 shrink-0 rounded-xl">
          <Sparkles className="relative z-10 h-5 w-5 text-white" aria-hidden="true" />
        </div>
        {isSidebarOpen && (
          <div className="overflow-hidden whitespace-nowrap">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">AI Concierge</h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Intelligence workspace</p>
          </div>
        )}
      </div>
        
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative flex items-center rounded-xl px-3 py-2.5 font-bold transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-violet-50 text-violet-700 shadow-sm ring-1 ring-violet-100 dark:bg-violet-950/30 dark:text-violet-300 dark:ring-violet-900/30'
                    : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100'
                } ${isSidebarOpen ? 'gap-3' : 'justify-center'}`
              }
              title={item.title}
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute right-2 h-2 w-2 rounded-full bg-violet-600 dark:bg-violet-300" aria-hidden="true"></span>}
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {isSidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
      
      <div className="mt-auto flex flex-col gap-1 border-t border-slate-200/80 pt-4 dark:border-slate-800">
        <a className={`flex cursor-pointer items-center rounded-xl px-3 py-2.5 text-slate-500 transition-all duration-200 hover:bg-slate-100/80 hover:text-slate-900 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100 ${isSidebarOpen ? 'gap-3' : 'justify-center'}`} title="Help">
          <CircleHelp className="h-5 w-5" aria-hidden="true" />
          {isSidebarOpen && <span>Help</span>}
        </a>
        <NavLink
          to={APP_ROUTES.settings}
          className={({ isActive }) =>
            `flex cursor-pointer items-center rounded-xl px-3 py-2.5 font-bold transition-all duration-200 active:scale-95 ${
              isActive
                ? 'bg-violet-50 text-violet-700 shadow-sm ring-1 ring-violet-100 dark:bg-violet-950/30 dark:text-violet-300 dark:ring-violet-900/30'
                : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100'
            } ${isSidebarOpen ? 'gap-3' : 'justify-center'}`
          }
          title="Settings"
        >
          <Settings className="h-5 w-5" aria-hidden="true" />
          {isSidebarOpen && <span>Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
};
