import React from 'react';
import { Database, FileText, Mail, X } from 'lucide-react';
import type { ChatContextChip } from '../types/chat-context.types';

interface ChatContextChipListProps {
  chips: ChatContextChip[];
  onRemove: (chipId: string) => void;
}

export const ChatContextChipList: React.FC<ChatContextChipListProps> = ({ chips, onRemove }) => {
  if (chips.length === 0) return null;

  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {chips.map((chip) => {
        const Icon = chip.source === 'gmail' ? Mail : chip.source === 'drive' ? Database : FileText;

        return (
          <span
            key={chip.id}
            className="inline-flex max-w-full items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-800 dark:border-violet-800/60 dark:bg-violet-950/30 dark:text-violet-200"
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 truncate">
              {chip.tag} {chip.label}
            </span>
            <button
              type="button"
              onClick={() => onRemove(chip.id)}
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-violet-500 transition-colors hover:bg-white hover:text-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:hover:bg-slate-950 dark:hover:text-violet-100"
              aria-label={`Remove ${chip.label}`}
              title="Remove context"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </span>
        );
      })}
    </div>
  );
};
