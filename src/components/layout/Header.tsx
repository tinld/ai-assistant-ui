import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toggleTheme } from "../../store/appSlice";
import type { RootState } from "../../store";

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isSidebarOpen = useSelector(
    (state: RootState) => state.app.isSidebarOpen,
  );
  const theme = useSelector((state: RootState) => state.app.theme);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/chat":
        return "Chat";
      case "/knowledge-base":
        return "Knowledge Base";
      case "/integrations":
        return "Integrations";
      case "/analytics":
        return "Analytics";
      default:
        return "Dashboard";
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 flex items-center justify-between px-8 h-16 border-b border-slate-200 dark:border-slate-800 shadow-none bg-white/80 dark:bg-slate-950/80 backdrop-blur-md text-violet-600 dark:text-violet-400 font-['Inter'] text-sm transition-all duration-300 ${
        isSidebarOpen
          ? "ml-64 w-[calc(100%-16rem)]"
          : "ml-20 w-[calc(100%-5rem)]"
      }`}
    >
      <div className="flex items-center gap-md font-bold text-lg">
        {getPageTitle()}
      </div>
      <div className="flex items-center gap-lg">
        <button className="text-slate-500 cursor-pointer transition-opacity opacity-100 hover:opacity-80 hover:text-violet-600 dark:hover:text-violet-400 flex items-center">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button 
          className="text-slate-500 cursor-pointer transition-opacity opacity-100 hover:opacity-80 hover:text-violet-600 dark:hover:text-violet-400 flex items-center"
          onClick={() => dispatch(toggleTheme())}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          <span className="material-symbols-outlined">
            {theme === 'light' ? 'dark_mode' : 'light_mode'}
          </span>
        </button>
        <div className="relative" ref={userMenuRef}>
          <button
            className={`text-slate-500 cursor-pointer transition-opacity opacity-100 hover:opacity-80 hover:text-violet-600 dark:hover:text-violet-400 flex items-center ${isUserMenuOpen ? "text-violet-600 dark:text-violet-400" : ""}`}
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            title="Profile & Settings"
          >
            <span className="material-symbols-outlined">account_circle</span>
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-lg shadow-[0_4px_20px_rgba(115,46,228,0.15)] border border-slate-100 dark:border-slate-800 py-1 z-50 transition-all origin-top-right animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  User Name
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  user@example.com
                </p>
              </div>
              <div className="py-1">
                <button
                  className="w-full text-left px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-slate-800 hover:text-violet-700 dark:hover:text-violet-300 flex items-center gap-3 transition-colors"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate("/profile");
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    person
                  </span>{" "}
                  Profile
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-slate-800 hover:text-violet-700 dark:hover:text-violet-300 flex items-center gap-3 transition-colors"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate("/settings");
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    settings
                  </span>{" "}
                  Settings
                </button>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
              <div className="py-1">
                <button
                  className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate("/login");
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    logout
                  </span>{" "}
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
