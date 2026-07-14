import React, { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  BarChart3,
  Bell,
  Bot,
  ChevronDown,
  FolderKanban,
  LogOut,
  Moon,
  Network,
  Search,
  Settings,
  Sun,
  User,
  UsersRound,
} from "lucide-react";
import { toggleTheme } from "../../store/appSlice";
import type { RootState } from "../../store";
import { APP_ROUTES } from "../../constants/route.constants";
import { BrandMark } from "../BrandMark";
import { useDismissibleLayer } from "../../hooks/useDismissibleLayer";

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.app.theme);
  const user = useSelector((state: RootState) => state.auth.user);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useDismissibleLayer({
    enabled: isUserMenuOpen,
    ref: userMenuRef,
    onDismiss: () => setIsUserMenuOpen(false),
  });

  const getPageTitle = (): string => {
    switch (location.pathname) {
      case APP_ROUTES.chat:
        return "Chat";
      case APP_ROUTES.files:
        return "File Manager";
      case "/knowledge-base":
        return "File Manager";
      case APP_ROUTES.agents:
        return "AI Agents";
      case APP_ROUTES.integrations:
        return "Integrations";
      case APP_ROUTES.analytics:
        return "Analytics";
      case APP_ROUTES.settings:
        return "Settings";
      default:
        return "Dashboard";
    }
  };

  const getPageIcon = () => {
    switch (location.pathname) {
      case APP_ROUTES.chat:
        return { icon: Bot, tone: 'from-sky-500 to-cyan-400 bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-950/30 dark:text-sky-300 dark:ring-sky-900/40' };
      case APP_ROUTES.files:
      case "/knowledge-base":
        return { icon: FolderKanban, tone: 'from-emerald-500 to-teal-400 bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900/40' };
      case APP_ROUTES.agents:
        return { icon: UsersRound, tone: 'from-violet-500 to-fuchsia-400 bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-950/30 dark:text-violet-300 dark:ring-violet-900/40' };
      case APP_ROUTES.integrations:
        return { icon: Network, tone: 'from-amber-500 to-orange-400 bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900/40' };
      case APP_ROUTES.analytics:
        return { icon: BarChart3, tone: 'from-rose-500 to-pink-400 bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-900/40' };
      case APP_ROUTES.settings:
        return { icon: Settings, tone: 'from-slate-500 to-slate-400 bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800' };
      default:
        return null;
    }
  };

  const getPageSubtitle = (): string => {
    switch (location.pathname) {
      case APP_ROUTES.chat:
        return "Structured answers, evidence, and next actions";
      case APP_ROUTES.files:
      case "/knowledge-base":
        return "Knowledge sources and searchable context";
      case APP_ROUTES.agents:
        return "Specialized assistants for repeatable work";
      case APP_ROUTES.integrations:
        return "Connected tools and automation endpoints";
      case APP_ROUTES.analytics:
        return "Usage, quality, and response performance";
      case APP_ROUTES.settings:
        return "System behavior and account controls";
      default:
        return "AI operating workspace";
    }
  };

  const pageIcon = getPageIcon();
  const PageIcon = pageIcon?.icon;

  return (
    <header
      className="theme-depth-surface sticky top-0 z-40 flex h-16 w-full shrink-0 items-center justify-between border-b border-white/70 bg-white/78 px-6 font-['Inter'] text-sm shadow-[0_10px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-all duration-300 dark:border-slate-800/80 dark:bg-slate-950/78 dark:shadow-black/25"
    >
      <div className="flex min-w-0 items-center gap-3">
        {PageIcon ? (
          <div className={`relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-2xl ring-1 ${pageIcon.tone}`}>
            <span className={`absolute inset-0 bg-gradient-to-br ${pageIcon.tone.split(' bg-')[0]} opacity-[0.12]`} aria-hidden="true"></span>
            <PageIcon className="relative h-5 w-5" aria-hidden="true" />
          </div>
        ) : (
          <BrandMark size="sm" />
        )}
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold text-slate-950 dark:text-white">{getPageTitle()}</h1>
          <p className="hidden truncate text-xs font-medium text-slate-500 dark:text-slate-400 sm:block">{getPageSubtitle()}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400 md:flex">
          <Search className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs font-semibold">Search workspace</span>
        </div>

        <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-violet-300" type="button" title="Notifications">
          <Bell className="h-5 w-5" aria-hidden="true" />
        </button>
        <button 
          className="theme-sweep-surface inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-violet-300"
          onClick={() => dispatch(toggleTheme())}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          type="button"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" aria-hidden="true" /> : <Sun className="h-5 w-5" aria-hidden="true" />}
        </button>
        <div className="relative" ref={userMenuRef}>
          <button
            className={`inline-flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 ${
              isUserMenuOpen
                ? "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300"
                : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-violet-700 dark:hover:text-violet-300"
            }`}
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            title="Profile & Settings"
            type="button"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold uppercase text-white dark:bg-slate-100 dark:text-slate-900">
              {user?.full_name?.[0] || user?.email?.[0] || "U"}
            </span>
            <ChevronDown className={`hidden h-4 w-4 transition-transform sm:block ${isUserMenuOpen ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-xl border border-slate-100 bg-white py-1 shadow-[0_22px_60px_rgba(15,23,42,0.16)] transition-all dark:border-slate-800 dark:bg-slate-950">
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {user?.full_name || "Signed-in user"}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                  {user?.email || "No email available"}
                </p>
              </div>
              <div className="py-1">
                <button
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-slate-600 transition-colors hover:bg-violet-50 hover:text-violet-700 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-violet-300"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate("/profile");
                  }}
                  type="button"
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  Profile
                </button>
                <button
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-slate-600 transition-colors hover:bg-violet-50 hover:text-violet-700 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-violet-300"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate("/settings");
                  }}
                  type="button"
                >
                  <Settings className="h-4 w-4" aria-hidden="true" />
                  Settings
                </button>
              </div>
              <div className="my-1 border-t border-slate-100 dark:border-slate-800"></div>
              <div className="py-1">
                <button
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate("/login");
                  }}
                  type="button"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
