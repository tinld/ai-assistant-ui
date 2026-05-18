import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { fileManagerApi } from '../services/fileManagerApi';
import { knowledgeBaseApi } from '../services/kbApi';
import type { RootState } from '../store';
import { addUploadTask, updateUploadProgress, updateUploadStatus } from '../store/uploadSlice';
import type { FileManagerDocument } from '../types/file.types';
import { formatBytes } from '../utils/formatters';
import { getFileIcon } from '../utils/file.utils';
import { StatusBadge } from '../components/StatusBadge';

type LibraryView = 'all' | 'synced' | 'ready' | 'unsupported';

const SUPPORTED_SYNC_TYPES = ['pdf', 'doc', 'docx', 'csv', 'txt', 'md'];

const getDocumentType = (name: string) => name.split('.').pop()?.toLowerCase() || 'unknown';

const normalizeTimestamp = (value?: string) => value || new Date().toISOString();

const mergeDocuments = (
  fileDocs: FileManagerDocument[],
  syncedDocs: FileManagerDocument[]
) => {
  const merged = new Map<string, FileManagerDocument>();

  fileDocs.forEach(doc => {
    const key = doc.id || doc.name.toLowerCase();
    merged.set(key, doc);
  });

  syncedDocs.forEach(doc => {
    const key = doc.id || doc.name.toLowerCase();
    const existing = merged.get(key) || Array.from(merged.values()).find(fileDoc => fileDoc.name === doc.name);

    if (existing) {
      merged.set(existing.id || key, {
        ...existing,
        in_kb: true,
        status: doc.status || existing.status,
        created_at: existing.created_at || doc.created_at,
        size: existing.size || doc.size
      });
      return;
    }

    merged.set(key, doc);
  });

  return Array.from(merged.values());
};

const getFileTone = (type: string) => {
  switch (type) {
    case 'pdf':
      return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
    case 'doc':
    case 'docx':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
    case 'csv':
      return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400';
    case 'txt':
    case 'md':
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
  }
};

export const FileManager: React.FC = () => {
  const [documents, setDocuments] = useState<FileManagerDocument[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [activeView, setActiveView] = useState<LibraryView>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch();
  const uploadTasks = useSelector((state: RootState) => state.upload.tasks);

  useEffect(() => {
    if (token) {
      loadFiles();
    }
  }, [token]);

  const loadFiles = async (): Promise<FileManagerDocument[]> => {
    try {
      setLoading(true);
      const [filesResult, syncedResult] = await Promise.allSettled([
        fileManagerApi.getFiles(token),
        knowledgeBaseApi.getDocuments(token)
      ]);

      const fileDocs: FileManagerDocument[] = filesResult.status === 'fulfilled' && filesResult.value?.data?.files
        ? filesResult.value.data.files.map(f => ({
          ...f,
          type: getDocumentType(f.name),
          status: 'indexed'
        }))
        : [];

      const syncedDocs: FileManagerDocument[] = syncedResult.status === 'fulfilled' && syncedResult.value?.data?.documents
        ? syncedResult.value.data.documents.map((d: any) => ({
          id: d.id,
          name: d.name,
          size: Number(d.size) || 0,
          created_at: normalizeTimestamp(d.created_at || d.uploaded_at || d.timestamp),
          type: getDocumentType(d.name),
          status: d.status || 'indexed',
          in_kb: true
        }))
        : [];

      if (filesResult.status === 'rejected' && syncedResult.status === 'rejected') {
        throw filesResult.reason;
      }

      const loadedDocs = mergeDocuments(fileDocs, syncedDocs);
      setDocuments(loadedDocs);
      return loadedDocs;
    } catch (err) {
      console.error('Failed to load files', err);
      setError('Failed to load files.');
      return [];
    } finally {
      setLoading(false);
    }
    return [];
  };

  const uploadingDocs: FileManagerDocument[] = useMemo(() => (
    uploadTasks
      .filter(t => t.status === 'uploading' || t.status === 'failed')
      .map(t => ({
        id: t.id,
        name: t.name,
        size: t.size,
        created_at: new Date().toISOString(),
        type: t.name.split('.').pop()?.toLowerCase() || 'unknown',
        status: t.status,
        progress: t.progress
      }))
  ), [uploadTasks]);

  const displayDocs = useMemo(() => [...uploadingDocs, ...documents], [uploadingDocs, documents]);

  const stats = useMemo(() => {
    const kbDocs = documents.filter(doc => doc.in_kb);
    const readyDocs = documents.filter(doc => SUPPORTED_SYNC_TYPES.includes(doc.type) && !doc.in_kb);
    const totalStorage = documents.reduce((sum, doc) => sum + doc.size, 0);

    return {
      total: documents.length,
      synced: kbDocs.length,
      ready: readyDocs.length,
      unsupported: documents.filter(doc => !SUPPORTED_SYNC_TYPES.includes(doc.type)).length,
      storage: totalStorage
    };
  }, [documents]);

  const filteredDocs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return displayDocs.filter(doc => {
      const isSupported = SUPPORTED_SYNC_TYPES.includes(doc.type);
      const matchesSearch = !normalizedSearch || doc.name.toLowerCase().includes(normalizedSearch) || doc.type.includes(normalizedSearch);

      if (!matchesSearch) return false;
      if (activeView === 'synced') return Boolean(doc.in_kb);
      if (activeView === 'ready') return isSupported && !doc.in_kb && doc.status !== 'uploading';
      if (activeView === 'unsupported') return !isSupported;
      return true;
    });
  }, [activeView, displayDocs, search]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    const file = files[0];

    if (file.size > 50 * 1024 * 1024) {
      setError(`File "${file.name}" exceeds the 50MB limit.`);
      return;
    }

    const tempId = Math.random().toString(36).substr(2, 9);

    dispatch(addUploadTask({
      id: tempId,
      name: file.name,
      progress: 0,
      status: 'uploading',
      size: file.size
    }));

    fileManagerApi.uploadFile(file, token, (progress) => {
      dispatch(updateUploadProgress({ id: tempId, progress }));
    }).then(() => {
      dispatch(updateUploadStatus({ id: tempId, status: 'indexed' }));
      loadFiles();
    }).catch(async () => {
      const refreshedDocs = await loadFiles();
      const wasUploaded = refreshedDocs.some(doc => doc.name === file.name);
      if (wasUploaded) {
        dispatch(updateUploadStatus({ id: tempId, status: 'indexed' }));
        return;
      }

      dispatch(updateUploadStatus({ id: tempId, status: 'failed' }));
      setError('Upload failed. Please try again.');
    });
  };

  const handleSyncToAI = async (docId: string, docType: string) => {
    if (!SUPPORTED_SYNC_TYPES.includes(docType)) {
      setError(`Cannot sync .${docType} files to AI context. Supported: PDF, DOCX, CSV, TXT, MD.`);
      return;
    }

    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, isSyncing: true } : d));
    setError(null);
    try {
      await fileManagerApi.syncToKnowledgeBase(docId, token);
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, isSyncing: false, in_kb: true } : d));
      loadFiles();
    } catch (err: any) {
      console.error(err);
      const refreshedDocs = await loadFiles();
      const refreshedDoc = refreshedDocs.find(d => d.id === docId);
      if (refreshedDoc?.in_kb) {
        setError(null);
        return;
      }

      setError(err.response?.data?.error || 'Sync may still be finishing. Refreshed file status from server.');
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, isSyncing: false } : d));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const viewOptions: { id: LibraryView; label: string; count: number }[] = [
    { id: 'all', label: 'All files', count: displayDocs.length },
    { id: 'synced', label: 'AI synced', count: stats.synced },
    { id: 'ready', label: 'Sync-ready', count: stats.ready },
    { id: 'unsupported', label: 'Storage only', count: stats.unsupported }
  ];

  return (
    <div className="flex-1 bg-surface-bright dark:bg-slate-900 overflow-y-auto font-['Inter']">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 flex flex-col gap-6">
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-5">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-xs font-semibold border border-violet-100 dark:border-violet-800/60 mb-3">
              <span className="material-symbols-outlined text-[16px]">hub</span>
              Smart file storage
            </div>
            <h1 className="text-3xl font-bold text-on-surface dark:text-slate-100">Intelligent File Manager</h1>
            <p className="text-on-surface-variant dark:text-slate-400 mt-2">
              Upload, search, and organize files in one place. Sync supported documents when they should power AI answers.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 bg-primary dark:bg-violet-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-violet-700 active:scale-95 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">upload</span>
              Upload File
            </button>
            <input
              type="file"
              ref={fileInputRef}
              hidden
              onChange={(e) => processFiles(e.target.files)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-950 border border-outline-variant dark:border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Cloud files</span>
              <span className="material-symbols-outlined text-slate-400">folder</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-3">{stats.total}</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{formatBytes(stats.storage)} stored</p>
          </div>

          <div className="bg-white dark:bg-slate-950 border border-outline-variant dark:border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">AI synced</span>
              <span className="material-symbols-outlined text-violet-500">psychology</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-3">{stats.synced}</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">available to assistant</p>
          </div>

          <div className="bg-white dark:bg-slate-950 border border-outline-variant dark:border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Sync-ready</span>
              <span className="material-symbols-outlined text-emerald-500">playlist_add_check</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-3">{stats.ready}</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">PDF, DOCX, CSV, TXT, MD</p>
          </div>

          <div className="bg-white dark:bg-slate-950 border border-outline-variant dark:border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Storage only</span>
              <span className="material-symbols-outlined text-blue-500">inventory_2</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-3">{stats.unsupported}</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">kept as files, not AI context</p>
          </div>
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${
            isDragging
              ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 scale-[1.01]'
              : 'border-outline-variant dark:border-slate-700 hover:border-violet-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${isDragging ? 'bg-violet-200 dark:bg-violet-800 text-violet-700 dark:text-violet-300' : 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'}`}>
                <span className="material-symbols-outlined text-2xl">cloud_upload</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface dark:text-slate-100">Drop files into storage</h3>
                <p className="text-sm text-on-surface-variant dark:text-slate-400 mt-1 max-w-2xl">
                  Uploaded files stay available here. PDF, DOCX, CSV, TXT, and MD files can be synced to AI when needed.
                </p>
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-violet-600 dark:text-violet-400 font-semibold hover:underline cursor-pointer text-sm text-left lg:text-right"
            >
              Browse files from computer
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 dark:hover:text-red-300">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {viewOptions.map(view => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors border ${
                  activeView === view.id
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white dark:bg-slate-950 border-outline-variant dark:border-slate-800 text-on-surface-variant dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {view.label}
                <span className={`ml-2 text-xs ${activeView === view.id ? 'text-violet-100' : 'text-slate-400'}`}>{view.count}</span>
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files or types..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-outline-variant dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:text-slate-200 dark:placeholder-slate-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-3xl animate-spin text-violet-500">sync</span>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
                  <span className="material-symbols-outlined text-3xl">search_off</span>
                </div>
                <h3 className="text-lg font-semibold text-on-surface dark:text-slate-200">No files found</h3>
                <p className="text-on-surface-variant dark:text-slate-400 mt-1">Upload a file or adjust the current filter.</p>
              </div>
            ) : (
              filteredDocs.map(doc => {
                const isSupported = SUPPORTED_SYNC_TYPES.includes(doc.type);

                return (
                  <div key={doc.id} className="bg-white dark:bg-slate-950 border border-outline-variant dark:border-slate-800 rounded-lg p-5 hover:shadow-md transition-shadow flex flex-col group min-h-[230px]">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getFileTone(doc.type)}`}>
                        <span className="material-symbols-outlined">{getFileIcon(doc.type)}</span>
                      </div>
                      {doc.in_kb ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-violet-700 dark:text-violet-300 px-2 py-1 bg-violet-50 dark:bg-violet-900/20 rounded-full" title="Synced to AI context">
                          <span className="material-symbols-outlined text-[14px]">psychology</span>
                          Synced
                        </span>
                      ) : (
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isSupported ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                          {isSupported ? 'Can sync' : 'Storage only'}
                        </span>
                      )}
                    </div>

                    <h4 className="font-semibold text-on-surface dark:text-slate-100 line-clamp-2 min-h-[44px]" title={doc.name}>{doc.name}</h4>

                    <div className="flex items-center gap-3 text-xs text-on-surface-variant dark:text-slate-400 my-4">
                      <span>{formatBytes(doc.size)}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50 flex flex-col gap-3">
                      {doc.status === 'uploading' && doc.progress !== undefined ? (
                        <div className="w-full">
                          <div className="flex justify-between text-xs mb-1 font-medium text-violet-700 dark:text-violet-400">
                            <span>Uploading...</span>
                            <span>{doc.progress}%</span>
                          </div>
                          <div className="w-full bg-violet-100 dark:bg-violet-900/30 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-violet-600 dark:bg-violet-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${doc.progress}%` }}></div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <StatusBadge status={doc.status} isFileManager={true} />
                          {doc.status === 'failed' && (
                            <button className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium">Retry</button>
                          )}
                          {doc.status === 'indexed' && !doc.in_kb && isSupported && (
                            <button
                              onClick={() => handleSyncToAI(doc.id, doc.type)}
                              disabled={doc.isSyncing}
                              className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 disabled:opacity-50 transition-colors"
                              title="Sync to AI context"
                            >
                              <span className={`material-symbols-outlined text-[14px] ${doc.isSyncing ? 'animate-spin' : ''}`}>{doc.isSyncing ? 'sync' : 'add_circle'}</span>
                              {doc.isSyncing ? 'Syncing...' : 'Sync to AI'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
        </div>
      </div>
    </div>
  );
};
