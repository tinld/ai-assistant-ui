import React from 'react';

export const Analytics: React.FC = () => {
  return (
    <div className="flex-1 p-8 flex items-center justify-center text-on-surface-variant">
      <div className="text-center">
        <span className="material-symbols-outlined text-6xl mb-4 text-primary opacity-50">bar_chart</span>
        <h2 className="text-2xl font-bold">Analytics</h2>
        <p className="mt-2">Lịch sử hội thoại và phân tích mức độ sử dụng.</p>
      </div>
    </div>
  );
};
