import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { RootState } from '../../store';

export const MainLayout: React.FC = () => {
  const isSidebarOpen = useSelector((state: RootState) => state.app.isSidebarOpen);

  return (
    <div className="min-h-screen bg-background flex overflow-hidden transition-all duration-300">
      <Sidebar />
      <div
        className={`flex min-h-screen min-w-0 flex-1 flex-col transition-all duration-300 ${
          isSidebarOpen ? 'ml-64 w-[calc(100%-16rem)]' : 'ml-20 w-[calc(100%-5rem)]'
        }`}
      >
        <Header />
        <main className="flex h-[calc(100vh-64px)] min-h-0 bg-background transition-all duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
