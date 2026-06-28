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
  UsersRound,
} from 'lucide-react';
import { toggleSidebar } from '../../store/appSlice';
import type { RootState, AppDispatch } from '../../store';
import { APP_ROUTES } from '../../constants/route.constants';
import { BrandMark } from '../BrandMark';

export const Sidebar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isSidebarOpen = useSelector((state: RootState) => state.app.isSidebarOpen);

  const navItems = [
    {
      to: APP_ROUTES.chat,
      label: 'Chat',
      title: 'Chat',
      icon: Bot,
      tone: 'from-sky-500 to-cyan-400 text-sky-700 bg-sky-50 ring-sky-100 dark:text-sky-300 dark:bg-sky-950/30 dark:ring-sky-900/40',
      active: 'bg-sky-50/90 text-sky-800 ring-sky-100 dark:bg-sky-950/35 dark:text-sky-200 dark:ring-sky-900/40',
    },
    {
      to: APP_ROUTES.agents,
      label: 'AI Agents',
      title: 'AI Agents',
      icon: UsersRound,
      tone: 'from-violet-500 to-fuchsia-400 text-violet-700 bg-violet-50 ring-violet-100 dark:text-violet-300 dark:bg-violet-950/30 dark:ring-violet-900/40',
      active: 'bg-violet-50/90 text-violet-800 ring-violet-100 dark:bg-violet-950/35 dark:text-violet-200 dark:ring-violet-900/40',
    },
    {
      to: APP_ROUTES.files,
      label: 'Files',
      title: 'Intelligent File Manager',
      icon: FolderKanban,
      tone: 'from-emerald-500 to-teal-400 text-emerald-700 bg-emerald-50 ring-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/30 dark:ring-emerald-900/40',
      active: 'bg-emerald-50/90 text-emerald-800 ring-emerald-100 dark:bg-emerald-950/35 dark:text-emerald-200 dark:ring-emerald-900/40',
    },
    {
      to: APP_ROUTES.integrations,
      label: 'Integrations',
      title: 'Integrations',
      icon: Network,
      tone: 'from-amber-500 to-orange-400 text-amber-700 bg-amber-50 ring-amber-100 dark:text-amber-300 dark:bg-amber-950/30 dark:ring-amber-900/40',
      active: 'bg-amber-50/90 text-amber-800 ring-amber-100 dark:bg-amber-950/35 dark:text-amber-200 dark:ring-amber-900/40',
    },
    {
      to: APP_ROUTES.analytics,
      label: 'Analytics',
      title: 'Analytics',
      icon: BarChart3,
      tone: 'from-rose-500 to-pink-400 text-rose-700 bg-rose-50 ring-rose-100 dark:text-rose-300 dark:bg-rose-950/30 dark:ring-rose-900/40',
      active: 'bg-rose-50/90 text-rose-800 ring-rose-100 dark:bg-rose-950/35 dark:text-rose-200 dark:ring-rose-900/40',
    },
  ];

  return (
    <aside className={`theme-depth-surface fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-white/70 bg-white/84 px-4 py-5 font-['Inter'] shadow-[12px_0_45px_rgba(15,23,42,0.08)] backdrop-blur-xl antialiased transition-all duration-300 dark:border-slate-800/80 dark:bg-slate-950/86 dark:shadow-black/25 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
      <button 
        onClick={() => dispatch(toggleSidebar())} 
        className="absolute -right-3.5 top-9 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-md transition-all hover:scale-105 hover:border-violet-300 hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-violet-700 dark:hover:text-violet-300"
        title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        type="button"
      >
        {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
      </button>

      <div className={`mb-7 flex items-center px-1 ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
        <BrandMark />
        {isSidebarOpen && (
          <div className="overflow-hidden whitespace-nowrap">
            <h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">Nexa AI</h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Intelligent operating space</p>
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
                `theme-sweep-surface group relative flex items-center rounded-2xl px-3 py-2.5 font-bold transition-all duration-200 active:scale-95 ${
                  isActive
                    ? `${item.active} shadow-[0_12px_28px_rgba(15,23,42,0.08)] ring-1 dark:shadow-black/20`
                    : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100'
                } ${isSidebarOpen ? 'gap-3' : 'justify-center'}`
              }
              title={item.title}
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-current" aria-hidden="true"></span>}
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 transition-transform duration-200 group-hover:-translate-y-0.5 ${item.tone}`}>
                    <span className={`absolute h-6 w-6 rounded-full bg-gradient-to-br ${item.tone.split(' text-')[0]} opacity-[0.15] blur-md`} aria-hidden="true"></span>
                    <Icon className="relative h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  {isSidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
      
      <div className="mt-auto flex flex-col gap-1 border-t border-slate-200/80 pt-4 dark:border-slate-800">
        <a className={`flex cursor-pointer items-center rounded-2xl px-3 py-2.5 text-slate-500 transition-all duration-200 hover:bg-slate-100/80 hover:text-slate-900 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100 ${isSidebarOpen ? 'gap-3' : 'justify-center'}`} title="Help">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-300 dark:ring-indigo-900/40">
            <CircleHelp className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          {isSidebarOpen && <span>Help</span>}
        </a>
        <NavLink
          to={APP_ROUTES.settings}
          className={({ isActive }) =>
            `theme-sweep-surface flex cursor-pointer items-center rounded-2xl px-3 py-2.5 font-bold transition-all duration-200 active:scale-95 ${
              isActive
                ? 'bg-slate-100 text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-white dark:ring-slate-800'
                : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100'
            } ${isSidebarOpen ? 'gap-3' : 'justify-center'}`
          }
          title="Settings"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800">
            <Settings className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          {isSidebarOpen && <span>Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
};
