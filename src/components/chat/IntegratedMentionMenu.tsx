import React, { useEffect, useMemo, useState } from 'react';
import { Check, LoaderCircle, Search, X } from 'lucide-react';

import { chatSourceService } from '../../services/chatSourceService';
import type { ChatSourceCapability, ChatSourceProvider, ChatSourceSelection } from '../../types/chat-source.types';
import type { FileItem } from '../../types/file.types';
import type { GoogleDriveFile } from '../../types/google-drive.types';
import { formatBytes } from '../../utils/formatters';
import { ChatSourceIcon } from './ChatSourceIcon';

interface IntegratedMentionMenuProps {
  token: string | null;
  inputValue: string;
  capabilities: ChatSourceCapability[];
  onConsumeMention: () => void;
  onSelect: (source: ChatSourceSelection) => void;
  onError: (message: string | null) => void;
}

const createClientId = (): string => (
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `source-${Date.now()}-${Math.random().toString(36).slice(2)}`
);

const mentionQuery = (value: string): string | null => {
  const match = value.match(/(?:^|\s)@([a-z]*)$/i);
  return match ? match[1].toLowerCase() : null;
};

const capabilityDescription = (capability: ChatSourceCapability): string => {
  if (capability.reconnect_required) return 'Connection expired. Reconnect to use Drive in chat';
  if (capability.provider === 'google_drive') return capability.account_label || 'Search connected Drive files';
  if (capability.provider === 'gmail') return 'Search Gmail for this message';
  return `${capability.eligible_count ?? 0} indexed files available`;
};

export const IntegratedMentionMenu: React.FC<IntegratedMentionMenuProps> = ({
  token,
  inputValue,
  capabilities,
  onConsumeMention,
  onSelect,
  onError,
}) => {
  const query = mentionQuery(inputValue);
  const [activeProvider, setActiveProvider] = useState<ChatSourceProvider | null>(null);
  const [resourceQuery, setResourceQuery] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const filteredCapabilities = useMemo(() => {
    if (query === null) return [];
    return capabilities.filter((capability) => capability.mention.toLowerCase().startsWith(query));
  }, [capabilities, query]);

  const filteredFiles = useMemo(() => {
    const normalized = resourceQuery.trim().toLowerCase();
    if (!normalized) return files;
    return files.filter((file) => file.name.toLowerCase().includes(normalized));
  }, [files, resourceQuery]);

  useEffect(() => {
    if (activeProvider !== 'files' || !token) return;
    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);
      onError(null);
      void chatSourceService.getEligibleFiles(token)
        .then((items) => {
          if (!cancelled) setFiles(items);
        })
        .catch(() => {
          if (!cancelled) onError('Unable to load synced files.');
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [activeProvider, onError, token]);

  useEffect(() => {
    if (activeProvider !== 'google_drive' || !token) return;
    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);
      onError(null);
      void chatSourceService.listDriveFiles(token, resourceQuery.trim())
        .then((response) => {
          if (!cancelled) setDriveFiles(response.files);
        })
        .catch(() => {
          if (!cancelled) onError('Unable to load Google Drive files.');
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [activeProvider, onError, resourceQuery, token]);

  const closePicker = (): void => {
    setActiveProvider(null);
    setResourceQuery('');
    setSelectingId(null);
  };

  const chooseCapability = (capability: ChatSourceCapability): void => {
    onConsumeMention();
    onError(null);
    if (capability.reconnect_required) {
      onError('Your Google Drive connection expired. Please reconnect Drive in Files, then try @Drive again.');
      return;
    }
    if (capability.provider === 'gmail') {
      onSelect({
        client_id: createClientId(),
        provider: 'gmail',
        resource_type: 'mailbox',
        label: 'Gmail',
      });
      return;
    }
    setResourceQuery('');
    setActiveProvider(capability.provider);
  };

  const chooseFile = (file: FileItem): void => {
    const documentId = file.document_id || file.kb_document_id;
    if (!documentId) return;
    onSelect({
      client_id: createClientId(),
      provider: file.source_provider === 'google_drive' || file.source === 'google_drive' ? 'google_drive' : 'files',
      resource_type: 'document',
      resource_id: documentId,
      label: file.name,
    });
    closePicker();
  };

  const chooseDriveFile = async (file: GoogleDriveFile): Promise<void> => {
    if (!token || selectingId) return;
    setSelectingId(file.id);
    onError(null);
    try {
      const result = await chatSourceService.syncDriveFile(file.id, true, token);
      const documentId = result.sync?.document_id;
      if (!documentId) throw new Error('Drive sync completed without a document ID.');
      onSelect({
        client_id: createClientId(),
        provider: 'google_drive',
        resource_type: 'document',
        resource_id: documentId,
        label: file.name,
      });
      closePicker();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unable to prepare this Drive file for chat.');
      setSelectingId(null);
    }
  };

  if (!activeProvider && (query === null || filteredCapabilities.length === 0)) return null;

  if (!activeProvider) {
    return (
      <div className="mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b border-slate-100 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:border-slate-800">
          Integrated
        </div>
        {filteredCapabilities.map((capability) => (
          <button
            key={capability.provider}
            type="button"
            onClick={() => chooseCapability(capability)}
            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none dark:hover:bg-slate-900 dark:focus:bg-slate-900 ${capability.reconnect_required ? 'bg-amber-50/70 dark:bg-amber-950/20' : ''}`}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <ChatSourceIcon provider={capability.provider} className="h-4 w-4 text-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-slate-900 dark:text-slate-100">@{capability.mention}</span>
              <span className={`block truncate text-xs ${capability.reconnect_required ? 'font-semibold text-amber-700 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'}`}>{capabilityDescription(capability)}</span>
            </span>
            {capability.reconnect_required && (
              <span className="shrink-0 rounded-md bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">Reconnect</span>
            )}
          </button>
        ))}
      </div>
    );
  }

  const isDrive = activeProvider === 'google_drive';
  const resources = isDrive ? driveFiles : filteredFiles;

  return (
    <div className="mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
        <ChatSourceIcon provider={activeProvider} className="h-4 w-4 text-[18px]" />
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Choose from {isDrive ? 'Drive' : 'Files'}</span>
        <button type="button" onClick={closePicker} className="ml-auto rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900" aria-label="Close source picker">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="border-b border-slate-100 p-2 dark:border-slate-800">
        <label className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 dark:bg-slate-900">
          <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
          <input
            value={resourceQuery}
            onChange={(event) => setResourceQuery(event.target.value)}
            className="h-9 min-w-0 flex-1 border-0 bg-transparent p-0 text-sm focus:ring-0 dark:text-slate-100"
            placeholder={`Search ${isDrive ? 'Drive' : 'synced files'}...`}
            autoFocus
          />
        </label>
      </div>
      <div className="max-h-64 overflow-y-auto p-1.5">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 px-3 py-8 text-xs font-semibold text-slate-500">
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading sources
          </div>
        )}
        {!isLoading && resources.length === 0 && (
          <p className="px-3 py-8 text-center text-xs text-slate-500">No available files found.</p>
        )}
        {!isLoading && isDrive && driveFiles.map((file) => (
          <button
            key={file.id}
            type="button"
            onClick={() => void chooseDriveFile(file)}
            disabled={Boolean(selectingId)}
            className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50 disabled:opacity-50 dark:hover:bg-slate-900"
          >
            <ChatSourceIcon provider="google_drive" className="h-4 w-4 text-[18px] text-blue-600" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold text-slate-800 dark:text-slate-200">{file.name}</span>
              <span className="block text-[10px] text-slate-500">{file.isGoogleWorkspaceFile ? 'Google file' : formatBytes(file.size)}</span>
            </span>
            {selectingId === file.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-slate-300" />}
          </button>
        ))}
        {!isLoading && !isDrive && filteredFiles.map((file) => (
          <button
            key={file.id}
            type="button"
            onClick={() => chooseFile(file)}
            className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            <ChatSourceIcon provider={file.source_provider === 'google_drive' || file.source === 'google_drive' ? 'google_drive' : 'files'} className="h-4 w-4 text-[18px]" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold text-slate-800 dark:text-slate-200">{file.name}</span>
              <span className="block text-[10px] text-slate-500">Indexed · {formatBytes(file.size)}</span>
            </span>
            <Check className="h-4 w-4 text-slate-300" />
          </button>
        ))}
      </div>
    </div>
  );
};
