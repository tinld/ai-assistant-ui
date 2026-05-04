import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="ml-64 h-[calc(100vh-64px)] flex bg-background w-[calc(100%-16rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
