import React from 'react';
import { X } from 'lucide-react';

import type { ChatSourceSelection } from '../../types/chat-source.types';
import { ChatSourceIcon } from './ChatSourceIcon';

interface ChatSourceChipsProps {
  sources: ChatSourceSelection[];
  onRemove?: (clientId: string) => void;
  compact?: boolean;
}

export const ChatSourceChips: React.FC<ChatSourceChipsProps> = ({ sources, onRemove, compact = false }) => {
  if (sources.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? 'mt-2' : 'mb-2'}`} aria-label="Selected chat sources">
      {sources.map((source) => (
        <span
          key={source.client_id ?? `${source.provider}-${source.resource_id ?? source.label}`}
          className={`inline-flex min-w-0 items-center gap-1.5 rounded-lg border font-semibold ${
            source.provider === 'google_drive'
              ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300'
              : source.provider === 'gmail'
                ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'
                : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
          } ${compact ? 'max-w-52 px-2 py-1 text-[10px]' : 'max-w-72 px-2.5 py-1.5 text-xs'}`}
        >
          <ChatSourceIcon provider={source.provider} className={compact ? 'h-3 w-3 text-[13px]' : 'h-3.5 w-3.5 text-[15px]'} />
          <span className="truncate">{source.label}</span>
          {onRemove && source.client_id && (
            <button
              type="button"
              onClick={() => source.client_id && onRemove(source.client_id)}
              className="-mr-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md opacity-60 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
              aria-label={`Remove ${source.label}`}
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          )}
        </span>
      ))}
    </div>
  );
};
