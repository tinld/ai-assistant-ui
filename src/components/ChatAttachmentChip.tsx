import React from 'react';
import { AlertTriangle, CheckCircle2, FileText, Loader2, X } from 'lucide-react';

import type { ChatAttachment } from '../types/chat-attachment.types';
import { formatBytes } from '../utils/formatters';

interface ChatAttachmentChipProps {
  attachment: ChatAttachment;
  onRemove: () => void;
}

const getStatusText = (attachment: ChatAttachment): string => {
  switch (attachment.status) {
    case 'uploading':
      return `Uploading ${attachment.progress}%`;
    case 'syncing':
      return 'Syncing to knowledge...';
    case 'ready':
      return 'Ready for chat';
    case 'failed':
      return attachment.error ?? 'Attachment failed';
  }
};

const AttachmentStatusIcon: React.FC<{ status: ChatAttachment['status'] }> = ({ status }) => {
  if (status === 'uploading' || status === 'syncing') {
    return <Loader2 className="h-4 w-4 animate-spin text-violet-600 dark:text-violet-400" aria-hidden="true" />;
  }
  if (status === 'ready') {
    return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />;
  }
  return <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden="true" />;
};

export const ChatAttachmentChip: React.FC<ChatAttachmentChipProps> = ({ attachment, onRemove }) => {
  const isBusy = attachment.status === 'uploading' || attachment.status === 'syncing';

  return (
    <div
      className={`mb-2 overflow-hidden rounded-xl border px-3 py-2.5 ${
        attachment.status === 'failed'
          ? 'border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30'
          : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/70'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-violet-600 shadow-sm dark:bg-slate-950 dark:text-violet-300">
          <FileText className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">{attachment.name}</p>
            <span className="shrink-0 text-[10px] font-semibold uppercase text-slate-400">{attachment.type}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <AttachmentStatusIcon status={attachment.status} />
            <span className="truncate">{getStatusText(attachment)}</span>
            <span aria-hidden="true">·</span>
            <span className="shrink-0">{formatBytes(attachment.size)}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={isBusy}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:cursor-wait disabled:opacity-40 dark:hover:bg-slate-950 dark:hover:text-slate-200"
          title={isBusy ? 'Wait for processing to finish' : 'Remove attachment from message'}
          aria-label="Remove attachment"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      {attachment.status === 'uploading' && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-950">
          <div
            className="h-full rounded-full bg-violet-600 transition-[width] duration-200 dark:bg-violet-400"
            style={{ width: `${attachment.progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};
