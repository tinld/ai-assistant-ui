import React from 'react';

interface StatusBadgeProps {
  status: 'indexed' | 'processing' | 'failed' | 'uploading' | string;
  isFileManager?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, isFileManager = false }) => {
  switch (status) {
    case 'indexed':
      return (
        <span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">check_circle</span>
          {isFileManager ? 'Uploaded' : 'Indexed'}
        </span>
      );
    case 'processing':
      return (
        <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
          Processing
        </span>
      );
    case 'failed':
      return (
        <span className="px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">error</span>
          Failed
        </span>
      );
    case 'uploading':
      return (
        <span className="px-2 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px] animate-pulse">cloud_upload</span>
          Uploading
        </span>
      );
    default:
      return null;
  }
};
