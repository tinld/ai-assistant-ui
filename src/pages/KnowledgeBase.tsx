import React from 'react';

export const KnowledgeBase: React.FC = () => {
  return (
    <div className="flex-1 p-8 flex items-center justify-center text-on-surface-variant">
      <div className="text-center">
        <span className="material-symbols-outlined text-6xl mb-4 text-primary opacity-50">database</span>
        <h2 className="text-2xl font-bold">Knowledge Base</h2>
        <p className="mt-2">Quản lý tài liệu và dữ liệu RAG của bạn ở đây.</p>
      </div>
    </div>
  );
};
