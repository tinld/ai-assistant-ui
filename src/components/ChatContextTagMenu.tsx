import React from 'react';
import { Database, FileText, Mail, Search } from 'lucide-react';
import type { ChatContextSource, ChatContextSourceOption } from '../types/chat-context.types';

interface ChatContextTagMenuProps {
  sources: ChatContextSourceOption[];
  highlightedIndex: number;
  onSelect: (source: ChatContextSourceOption) => void;
}

const sourceIcon = (source: ChatContextSource) => {
  switch (source) {
    case 'gmail':
      return Mail;
    case 'drive':
      return Database;
    case 'files':
    case 'synced':
      return FileText;
    default:
      return Search;
  }
};

export const ChatContextTagMenu: React.FC<ChatContextTagMenuProps> = ({
  sources,
  highlightedIndex,
  onSelect,
}) => (
  <div className="mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
    <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
      <Search className="h-4 w-4" aria-hidden="true" />
      Context sources
    </div>
    <div className="max-h-56 overflow-y-auto p-1.5">
      {sources.map((source, index) => {
        const Icon = sourceIcon(source.source);
        const isHighlighted = index === highlightedIndex;

        return (
          <button
            key={source.source}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(source)}
            className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors ${
              isHighlighted
                ? 'bg-violet-50 dark:bg-violet-950/30'
                : 'hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-bold text-slate-900 dark:text-slate-100">{source.tag}</span>
              <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">{source.description}</span>
            </span>
            {source.isConnected === false && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                Connect
              </span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);
