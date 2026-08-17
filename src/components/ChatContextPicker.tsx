import React from 'react';
import { AlertTriangle, Database, FileText, Loader2, Mail, Search, X } from 'lucide-react';
import type { ChatContextSource, ChatContextSourceOption, SourceSearchResult } from '../types/chat-context.types';

interface ChatContextPickerProps {
  source: ChatContextSourceOption | null;
  query: string;
  results: SourceSearchResult[];
  isLoading: boolean;
  error: string | null;
  onQueryChange: (query: string) => void;
  onClose: () => void;
  onSelectResult: (result: SourceSearchResult) => void;
}

const renderSourceIcon = (source?: ChatContextSource, className = 'h-4 w-4') => {
  switch (source) {
    case 'gmail':
      return <Mail className={className} aria-hidden="true" />;
    case 'drive':
      return <Database className={className} aria-hidden="true" />;
    case 'files':
    case 'synced':
      return <FileText className={className} aria-hidden="true" />;
    default:
      return <Search className={className} aria-hidden="true" />;
  }
};

export const ChatContextPicker: React.FC<ChatContextPickerProps> = ({
  source,
  query,
  results,
  isLoading,
  error,
  onQueryChange,
  onClose,
  onSelectResult,
}) => {
  if (!source) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/30 px-3 pb-3 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
              {renderSourceIcon(source.source)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{source.tag}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{source.description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:hover:bg-slate-900 dark:hover:text-slate-100"
            title="Close picker"
            aria-label="Close context picker"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="border-b border-slate-200 p-3 dark:border-slate-800">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-500/30 dark:border-slate-800 dark:bg-slate-900/70">
            <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-0 dark:text-slate-100 dark:placeholder:text-slate-500"
              placeholder={`Search ${source.displayName}`}
              autoFocus
            />
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-violet-600" aria-hidden="true" />}
          </div>
        </div>

        <div className="max-h-[24rem] overflow-y-auto p-2">
          {error && (
            <div className="m-1 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {!error && !isLoading && results.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No matching items.
            </div>
          )}

          {results.map((result) => (
            <button
              key={`${result.source}-${result.id}`}
              type="button"
              onClick={() => onSelectResult(result)}
              className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:hover:bg-violet-950/20"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                {renderSourceIcon(source.source, 'h-3.5 w-3.5')}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-slate-900 dark:text-slate-100">{result.title}</span>
                {result.subtitle && (
                  <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">{result.subtitle}</span>
                )}
                {result.preview && (
                  <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500 dark:text-slate-400">{result.preview}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
