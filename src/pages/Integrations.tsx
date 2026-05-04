import React from 'react';

export const Integrations: React.FC = () => {
  return (
    <div className="flex-1 p-8 flex items-center justify-center text-on-surface-variant">
      <div className="text-center">
        <span className="material-symbols-outlined text-6xl mb-4 text-primary opacity-50">extension</span>
        <h2 className="text-2xl font-bold">Integrations</h2>
        <p className="mt-2">Cấu hình API và các tích hợp hệ thống bên ngoài.</p>
      </div>
    </div>
  );
};
