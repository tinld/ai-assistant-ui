import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { ApiError } from '../services/api';
import { googleDriveApi } from '../services/googleDriveApi';
import type { GoogleDriveFile, GoogleDriveStatus } from '../types/google-drive.types';
import { formatBytes } from '../utils/formatters';

interface GoogleDrivePanelProps {
  token: string | null;
  onFileSynced: () => Promise<unknown>;
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const formatDateTime = (value?: string | null): string => {
  if (!value) return 'Never';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const getFileSizeLabel = (file: GoogleDriveFile): string => (
  file.isFolder ? 'Folder' : file.isGoogleWorkspaceFile ? 'Google file' : formatBytes(file.size)
);

const getErrorMessage = (error: unknown, fallback: string): string => (
  error instanceof ApiError ? error.message : fallback
);

export const GoogleDrivePanel: React.FC<GoogleDrivePanelProps> = ({ token, onFileSynced, onToast }) => {
  const [status, setStatus] = useState<GoogleDriveStatus | null>(null);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [query, setQuery] = useState('');
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [syncingFileId, setSyncingFileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canBrowse = Boolean(status?.configured && status.connected);

  const statusLabel = useMemo(() => {
    if (!status?.configured) return 'Setup needed';
    if (status.connected) return 'Connected';
    return 'Not connected';
  }, [status]);

  const loadStatus = useCallback(async (): Promise<void> => {
    if (!token) return;
    setIsLoadingStatus(true);
    setError(null);
    try {
      const nextStatus = await googleDriveApi.getStatus(token);
      setStatus(nextStatus);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load Google Drive status.'));
    } finally {
      setIsLoadingStatus(false);
    }
  }, [token]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadStatus(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadStatus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const driveResult = params.get('googleDrive');
    if (!driveResult) return;

    onToast(
      driveResult === 'connected' ? 'Google Drive connected.' : 'Google Drive connection failed.',
      driveResult === 'connected' ? 'success' : 'error'
    );
    window.history.replaceState({}, document.title, window.location.pathname);
    const timeoutId = window.setTimeout(() => void loadStatus(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadStatus, onToast]);

  const connectDrive = async (): Promise<void> => {
    if (!token) return;
    setError(null);
    try {
      const response = await googleDriveApi.connect(token);
      window.location.href = response.authorization_url;
    } catch (err) {
      setError(getErrorMessage(err, 'Google Drive is not ready. Check backend Google credentials.'));
    }
  };

  const disconnectDrive = async (): Promise<void> => {
    if (!token) return;
    setError(null);
    try {
      await googleDriveApi.disconnect(token);
      setFiles([]);
      setNextPageToken(null);
      await loadStatus();
      onToast('Google Drive disconnected.', 'success');
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to disconnect Google Drive.'));
    }
  };

  const loadFiles = async (mode: 'replace' | 'append' = 'replace'): Promise<void> => {
    if (!token || !canBrowse) return;
    setIsLoadingFiles(true);
    setError(null);
    try {
      const response = await googleDriveApi.listFiles(token, query.trim(), mode === 'append' ? nextPageToken : null);
      setFiles((current) => (mode === 'append' ? [...current, ...response.files] : response.files));
      setNextPageToken(response.nextPageToken ?? null);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to list Google Drive files.'));
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const syncFile = async (file: GoogleDriveFile, syncToKb: boolean): Promise<void> => {
    if (!token || syncingFileId) return;
    setSyncingFileId(file.id);
    setError(null);
    try {
      const result = await googleDriveApi.syncFile(file.id, syncToKb, token);
      await onFileSynced();
      if (result.unchanged) {
        onToast('Drive file is already up to date.', 'info');
      } else {
        onToast(syncToKb ? 'Drive file synced to AI.' : 'Drive file added to storage.', 'success');
      }
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to sync this Drive file.');
      setError(message);
      onToast(message, 'error');
    } finally {
      setSyncingFileId(null);
    }
  };

  return (
    <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
              <span className="material-symbols-outlined">add_to_drive</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Google Drive</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {status?.email ? `${status.email} - last sync ${formatDateTime(status.lastSyncedAt)}` : 'Connect Drive and sync selected files into storage.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {isLoadingStatus ? 'Checking' : statusLabel}
          </span>
          {status?.connected ? (
            <button
              type="button"
              onClick={disconnectDrive}
              className="rounded-lg border border-outline-variant px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={connectDrive}
              disabled={isLoadingStatus || status?.configured === false}
              className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
            >
              Connect Drive
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {status?.configured === false && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          Add Google OAuth credentials on the backend before users can connect Drive.
        </div>
      )}

      {canBrowse && (
        <div className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void loadFiles('replace');
                }}
                placeholder="Search Drive files..."
                className="w-full rounded-lg border border-outline-variant bg-white py-2.5 pl-10 pr-4 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <button
              type="button"
              onClick={() => void loadFiles('replace')}
              disabled={isLoadingFiles}
              className="rounded-lg border border-outline-variant px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              {isLoadingFiles ? 'Loading...' : 'Browse files'}
            </button>
          </div>

          {files.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-outline-variant dark:border-slate-800">
              <div className="max-h-[320px] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
                {files.map((file) => (
                  <div key={file.id} className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100" title={file.name}>
                        {file.name}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{getFileSizeLabel(file)}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <span>{formatDateTime(file.modifiedTime)}</span>
                        {file.isGoogleWorkspaceFile && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <span>Exports before sync</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <button
                        type="button"
                        onClick={() => void syncFile(file, false)}
                        disabled={Boolean(syncingFileId) || file.isFolder || file.isSupported === false}
                        className="rounded-lg border border-outline-variant px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
                      >
                        {syncingFileId === file.id ? 'Syncing...' : 'Add to storage'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void syncFile(file, true)}
                        disabled={Boolean(syncingFileId) || file.isFolder || file.isSupported === false}
                        className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-700 disabled:cursor-wait disabled:bg-slate-300 dark:disabled:bg-slate-700"
                      >
                        Sync to AI
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {nextPageToken && (
            <button
              type="button"
              onClick={() => void loadFiles('append')}
              disabled={isLoadingFiles}
              className="self-start rounded-lg border border-outline-variant px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Load more
            </button>
          )}
        </div>
      )}
    </section>
  );
};
