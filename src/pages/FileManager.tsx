import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { fileManagerApi } from '../services/fileManagerApi';
import { knowledgeBaseApi } from '../services/kbApi';
import type { RootState } from '../store';
import { addUploadTask, updateUploadProgress, updateUploadStatus } from '../store/uploadSlice';
import type { FileManagerDocument } from '../types/file.types';
import { formatBytes } from '../utils/formatters';
import { getFileExtension, getFileIcon, isSupportedKnowledgeFileType } from '../utils/file.utils';
import { StatusBadge } from '../components/StatusBadge';
import { NotificationToast, type NotificationToastData } from '../components/NotificationToast';
import {
  FILE_MANAGER_UPLOAD_MAX_SIZE_BYTES,
  FILE_MANAGER_UPLOAD_MAX_SIZE_LABEL,
  SUPPORTED_KNOWLEDGE_FILE_TYPES_LABEL,
} from '../constants/file.constants';

type LibraryView = 'all' | 'synced' | 'ready' | 'unsupported';
type DisplayMode = 'titles' | 'contents' | 'details';

const humanizeLabel = (value: string): string => (
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase())
);

const normalizeClassificationValue = (value?: string | string[] | null): string | null => {
  if (Array.isArray(value)) {
    const firstValue = value.find((item) => item.trim().length > 0);
    return firstValue ? humanizeLabel(firstValue) : null;
  }

  return value && value.trim().length > 0 ? humanizeLabel(value) : null;
};

const getFallbackClassification = (type: string): string => {
  switch (type) {
    case 'pdf':
    case 'doc':
    case 'docx':
    case 'txt':
    case 'md':
      return 'Document';
    case 'csv':
      return 'Spreadsheet';
    case 'png':
    case 'jpg':
    case 'jpeg':
      return 'Image';
    default:
      return 'Storage File';
  }
};

const getDocumentDomain = (doc: FileManagerDocument): string | null => (
  normalizeClassificationValue(doc.domain)
  ?? normalizeClassificationValue(doc.metadata?.domain)
);

const getDocumentClassification = (doc: FileManagerDocument): string => (
  normalizeClassificationValue(doc.classification)
  ?? normalizeClassificationValue(doc.metadata?.classification)
  ?? normalizeClassificationValue(doc.category)
  ?? normalizeClassificationValue(doc.metadata?.category)
  ?? normalizeClassificationValue(doc.document_type)
  ?? normalizeClassificationValue(doc.metadata?.document_type)
  ?? normalizeClassificationValue(doc.file_type)
  ?? normalizeClassificationValue(doc.metadata?.file_type)
  ?? normalizeClassificationValue(doc.tags)
  ?? normalizeClassificationValue(doc.metadata?.tags)
  ?? normalizeClassificationValue(doc.content_type?.split('/').pop())
  ?? normalizeClassificationValue(doc.metadata?.content_type?.split('/').pop())
  ?? normalizeClassificationValue(doc.mime_type?.split('/').pop())
  ?? normalizeClassificationValue(doc.metadata?.mime_type?.split('/').pop())
  ?? getFallbackClassification(doc.type)
);

const getKnowledgeDocumentId = (doc: FileManagerDocument): string | null => (
  doc.document_id || doc.kb_document_id || null
);

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
  const [toast, setToast] = useState<NotificationToastData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [activeView, setActiveView] = useState<LibraryView>('all');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('contents');
  const [isDisplayMenuOpen, setIsDisplayMenuOpen] = useState(false);
  const [openDocumentMenu, setOpenDocumentMenu] = useState<{ key: string; top: number; left: number } | null>(null);
  const [renameDialog, setRenameDialog] = useState<{ doc: FileManagerDocument; value: string; isSaving: boolean } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ doc: FileManagerDocument; isDeleting: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const displayMenuRef = useRef<HTMLDivElement>(null);
  const documentMenuRef = useRef<HTMLDivElement>(null);
  const toastIdRef = useRef(0);
  const togglingDocumentIdsRef = useRef<Set<string>>(new Set());
  const renamingKeysRef = useRef<Set<string>>(new Set());
  const deletingKeysRef = useRef<Set<string>>(new Set());
  const token = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch();
  const uploadTasks = useSelector((state: RootState) => state.upload.tasks);

  useEffect(() => {
    if (token) {
      loadFiles();
    }
  }, [token]);

  useEffect(() => {
    if (!isDisplayMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!displayMenuRef.current?.contains(event.target as Node)) {
        setIsDisplayMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [isDisplayMenuOpen]);

  useEffect(() => {
    if (!openDocumentMenu) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!documentMenuRef.current?.contains(event.target as Node)) {
        setOpenDocumentMenu(null);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [openDocumentMenu]);

  useEffect(() => {
    if (!toast) return;
    if (toast.phase === 'enter') {
      const timeoutId = window.setTimeout(() => {
        setToast((current) => current ? { ...current, phase: 'exit' } : null);
      }, 2200);
      return () => window.clearTimeout(timeoutId);
    }

    const timeoutId = window.setTimeout(() => setToast(null), 220);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const showToast = (message: string, type: NotificationToastData['type']) => {
    toastIdRef.current += 1;
    setToast({ id: toastIdRef.current, message, type, phase: 'enter' });
  };

  const loadFiles = async (): Promise<FileManagerDocument[]> => {
    try {
      setLoading(true);
      const filesResult = await fileManagerApi.getFiles(token);

      const loadedDocs: FileManagerDocument[] = filesResult.data.files
        ? filesResult.data.files.map(f => ({
          ...f,
          source_file_id: f.source_file_id ?? f.id,
          type: getFileExtension(f.name),
          status: f.status || (f.in_kb ? 'indexed' : 'uploaded')
        }))
        : [];

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
      .filter(t => t.status === 'uploading' || t.status === 'processing' || t.status === 'failed')
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
    const readyDocs = documents.filter(doc => isSupportedKnowledgeFileType(doc.type) && !doc.in_kb);
    const totalStorage = documents.reduce((sum, doc) => sum + doc.size, 0);

    return {
      total: documents.length,
      synced: kbDocs.length,
      ready: readyDocs.length,
      unsupported: documents.filter(doc => !isSupportedKnowledgeFileType(doc.type)).length,
      storage: totalStorage
    };
  }, [documents]);

  const filteredDocs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return displayDocs.filter(doc => {
      const isSupported = isSupportedKnowledgeFileType(doc.type);
      const domain = getDocumentDomain(doc)?.toLowerCase() ?? '';
      const classification = getDocumentClassification(doc).toLowerCase();
      const matchesSearch = !normalizedSearch
        || doc.name.toLowerCase().includes(normalizedSearch)
        || doc.type.includes(normalizedSearch)
        || domain.includes(normalizedSearch)
        || classification.includes(normalizedSearch);

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

    if (file.size > FILE_MANAGER_UPLOAD_MAX_SIZE_BYTES) {
      setError(`File "${file.name}" exceeds the ${FILE_MANAGER_UPLOAD_MAX_SIZE_LABEL} limit.`);
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
    }).then(async (uploadResponse) => {
      const uploadedFileId = uploadResponse?.file?.id;

      if (!uploadedFileId) {
        dispatch(updateUploadStatus({ id: tempId, status: 'failed' }));
        setError('Upload finished but server did not return a file id.');
        showToast('Upload finished but file state could not be updated.', 'error');
        loadFiles();
        return;
      }

      dispatch(updateUploadStatus({ id: tempId, status: 'uploaded' }));
      showToast('File uploaded. Use Sync to AI when you want to index it.', 'success');
      loadFiles();
    }).catch(async () => {
      const refreshedDocs = await loadFiles();
      const wasUploaded = refreshedDocs.some(doc => doc.name === file.name);
      if (wasUploaded) {
        dispatch(updateUploadStatus({ id: tempId, status: 'uploaded' }));
        return;
      }

      dispatch(updateUploadStatus({ id: tempId, status: 'failed' }));
      setError('Upload failed. Please try again.');
    });
  };

  const handleSyncToAI = async (docId: string, docType: string) => {
    if (!isSupportedKnowledgeFileType(docType)) {
      setError(`Cannot sync .${docType} files to AI context. Supported: ${SUPPORTED_KNOWLEDGE_FILE_TYPES_LABEL}.`);
      return;
    }

    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, isSyncing: true, status: 'processing' } : d));
    setError(null);
    try {
      const response = await fileManagerApi.syncToKnowledgeBase(docId, token);
      setDocuments(prev => prev.map(d => d.id === docId ? {
        ...d,
        isSyncing: false,
        in_kb: true,
        status: 'indexed',
        document_id: response?.document_id || d.document_id || null,
        kb_document_id: response?.document_id || d.kb_document_id || null,
        search_enabled: response?.search_enabled ?? true,
      } : d));
      showToast('Document synced to AI.', 'success');
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
      showToast(err.response?.data?.error || 'Failed to sync document to AI.', 'error');
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, isSyncing: false, status: d.in_kb ? 'indexed' : 'uploaded' } : d));
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

  const handleToggleSearchEnabled = async (doc: FileManagerDocument) => {
    const documentId = getKnowledgeDocumentId(doc);
    if (!documentId) {
      showToast('Sync this file to AI before changing search visibility.', 'error');
      return;
    }
    if (togglingDocumentIdsRef.current.has(documentId)) return;

    const nextSearchEnabled = !(doc.search_enabled !== false);
    togglingDocumentIdsRef.current.add(documentId);
    setOpenDocumentMenu(null);
    showToast(nextSearchEnabled ? 'Making file visible to AI search...' : 'Hiding file from AI search...', 'info');

    setDocuments((prev) => prev.map((item) => item.id === doc.id ? {
      ...item,
      isTogglingSearch: true,
      search_enabled: nextSearchEnabled,
    } : item));
    setError(null);

    try {
      await knowledgeBaseApi.setDocumentSearchEnabled(documentId, nextSearchEnabled, token);
      setDocuments((prev) => prev.map((item) => item.id === doc.id ? {
        ...item,
        isTogglingSearch: false,
        search_enabled: nextSearchEnabled,
      } : item));
      showToast(nextSearchEnabled ? 'AI search enabled for document.' : 'AI search disabled for document.', 'success');
    } catch (err: any) {
      console.error('Failed to update AI search state', err);
      setDocuments((prev) => prev.map((item) => item.id === doc.id ? {
        ...item,
        isTogglingSearch: false,
        search_enabled: doc.search_enabled,
      } : item));
      setError(err.response?.data?.error || 'Failed to update AI search state.');
      showToast(err.response?.data?.error || 'Failed to update AI search state.', 'error');
    } finally {
      togglingDocumentIdsRef.current.delete(documentId);
    }
  };

  const submitRenameDocument = async () => {
    if (!renameDialog) return;

    const doc = renameDialog.doc;
    const nextName = renameDialog.value.trim();
    if (!nextName || nextName === doc.name) {
      setRenameDialog(null);
      return;
    }

    const actionKey = doc.source_file_id || doc.document_id || doc.kb_document_id || doc.id;
    if (renamingKeysRef.current.has(actionKey)) return;
    renamingKeysRef.current.add(actionKey);
    setRenameDialog((current) => current ? { ...current, isSaving: true } : current);
    setError(null);

    try {
      if (doc.source_file_id) {
        await fileManagerApi.updateFile(doc.source_file_id, nextName, token);
      } else {
        const documentId = doc.document_id || doc.kb_document_id || doc.id;
        await knowledgeBaseApi.updateDocument(documentId, nextName, token);
      }

      setDocuments(prev => prev.map(item => {
        const sameDocument = item.id === doc.id
          || (doc.document_id && item.document_id === doc.document_id)
          || (doc.kb_document_id && item.kb_document_id === doc.kb_document_id)
          || (doc.source_file_id && item.source_file_id === doc.source_file_id);
        return sameDocument ? { ...item, name: nextName } : item;
      }));
      showToast('File name updated.', 'success');
      setRenameDialog(null);
    } catch (err: any) {
      console.error('Failed to rename file', err);
      setError(err.response?.data?.error || 'Failed to rename file.');
      showToast(err.response?.data?.error || 'Failed to rename file.', 'error');
      setRenameDialog((current) => current ? { ...current, isSaving: false } : current);
    } finally {
      renamingKeysRef.current.delete(actionKey);
    }
  };

  const submitDeleteDocument = async () => {
    if (!deleteDialog) return;

    const doc = deleteDialog.doc;
    const actionKey = doc.source_file_id || doc.document_id || doc.kb_document_id || doc.id;
    if (deletingKeysRef.current.has(actionKey)) return;
    deletingKeysRef.current.add(actionKey);
    setOpenDocumentMenu(null);
    setDeleteDialog((current) => current ? { ...current, isDeleting: true } : current);
    setError(null);

    try {
      if (doc.source_file_id) {
        await fileManagerApi.deleteFile(doc.source_file_id, token);
      } else {
        const documentId = doc.document_id || doc.kb_document_id || doc.id;
        await knowledgeBaseApi.deleteDocument(documentId, token);
      }

      setDocuments(prev => prev.filter(item => {
        const sameDocument = item.id === doc.id
          || (doc.document_id && item.document_id === doc.document_id)
          || (doc.kb_document_id && item.kb_document_id === doc.kb_document_id)
          || (doc.source_file_id && item.source_file_id === doc.source_file_id);
        return !sameDocument;
      }));
      showToast('File deleted.', 'success');
      setDeleteDialog(null);
    } catch (err: any) {
      console.error('Failed to delete file', err);
      setError(err.response?.data?.error || 'Failed to delete file.');
      showToast(err.response?.data?.error || 'Failed to delete file.', 'error');
      setDeleteDialog((current) => current ? { ...current, isDeleting: false } : current);
    } finally {
      deletingKeysRef.current.delete(actionKey);
    }
  };

  const viewOptions: { id: LibraryView; label: string; count: number }[] = [
    { id: 'all', label: 'All files', count: displayDocs.length },
    { id: 'synced', label: 'AI synced', count: stats.synced },
    { id: 'ready', label: 'Sync-ready', count: stats.ready },
    { id: 'unsupported', label: 'Storage only', count: stats.unsupported }
  ];

  const displayModeOptions: { id: DisplayMode; label: string; icon: string; description: string }[] = [
    { id: 'titles', label: 'Titles', icon: 'format_list_bulleted', description: 'Compact list for scanning names fast.' },
    { id: 'contents', label: 'Contents', icon: 'grid_view', description: 'Visual cards with metadata and actions.' },
    { id: 'details', label: 'Details', icon: 'table_rows', description: 'Dense table for sorting and comparison.' }
  ];
  const activeDisplayMode = displayModeOptions.find(mode => mode.id === displayMode) ?? displayModeOptions[1];

  const getDocumentActionKey = (doc: FileManagerDocument): string =>
    doc.source_file_id || doc.document_id || doc.kb_document_id || doc.id;

  const openDocumentMenuAt = (doc: FileManagerDocument, element: HTMLButtonElement) => {
    const rect = element.getBoundingClientRect();
    const menuWidth = 240;
    const viewportPadding = 12;
    const left = Math.min(
      Math.max(viewportPadding, rect.right - menuWidth),
      window.innerWidth - menuWidth - viewportPadding
    );

    setOpenDocumentMenu({
      key: getDocumentActionKey(doc),
      top: rect.bottom + 8,
      left,
    });
  };

  const renderDocumentControls = (doc: FileManagerDocument) => {
    const actionKey = getDocumentActionKey(doc);
    const isMenuOpen = openDocumentMenu?.key === actionKey;

    return (
      <div className="relative">
        <button
          type="button"
          onClick={(event) => {
            const button = event.currentTarget;
            if (isMenuOpen) {
              setOpenDocumentMenu(null);
              return;
            }
            openDocumentMenuAt(doc, button);
          }}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-900 dark:hover:text-slate-200 ${
            isMenuOpen ? 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200' : ''
          }`}
          title="File actions"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
        >
          <span className="material-symbols-outlined text-[18px]">more_horiz</span>
        </button>
      </div>
    );
  };

  const renderSearchVisibilityTag = (doc: FileManagerDocument) => {
    if (!doc.in_kb) return null;

    const isSearchEnabled = doc.search_enabled !== false;

    return (
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
          isSearchEnabled
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
        }`}
        title={isSearchEnabled ? 'This synced file can appear in AI search.' : 'This synced file is hidden from AI search.'}
      >
        {isSearchEnabled ? 'Visible' : 'Hidden'}
      </span>
    );
  };

  return (
    <div className="flex-1 bg-surface-bright dark:bg-slate-900 overflow-y-auto font-['Inter']">
      {openDocumentMenu && (() => {
        const activeDocument = documents.find((doc) => getDocumentActionKey(doc) === openDocumentMenu.key);
        if (!activeDocument) return null;

        const actionKey = getDocumentActionKey(activeDocument);
        const isBusy = deletingKeysRef.current.has(actionKey) || renamingKeysRef.current.has(actionKey);
        const documentId = getKnowledgeDocumentId(activeDocument);
        const isSearchEnabled = activeDocument.search_enabled !== false;
        const isSupported = isSupportedKnowledgeFileType(activeDocument.type);

        return (
          <div
            ref={documentMenuRef}
            className="fixed z-50 min-w-[240px] overflow-hidden rounded-xl border border-outline-variant bg-white p-1.5 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
            style={{ top: openDocumentMenu.top, left: openDocumentMenu.left }}
          >
            {activeDocument.in_kb ? (
              <button
                type="button"
                onClick={() => void handleToggleSearchEnabled(activeDocument)}
                disabled={activeDocument.isTogglingSearch || !documentId}
                className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  isSearchEnabled
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  <span className={`material-symbols-outlined text-[16px] ${activeDocument.isTogglingSearch ? 'animate-spin' : ''}`}>
                    {activeDocument.isTogglingSearch ? 'sync' : (isSearchEnabled ? 'visibility_off' : 'visibility')}
                  </span>
                </span>
                <span>
                  <span className="block text-sm font-semibold">{activeDocument.isTogglingSearch ? 'Updating AI search' : (isSearchEnabled ? 'Hide from AI search' : 'Enable AI search')}</span>
                  <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                    {isSearchEnabled
                      ? 'Keep this file indexed, but exclude it from retrieval.'
                      : documentId ? 'Allow this synced file to appear in retrieval again.' : 'Finish syncing before enabling AI search.'}
                  </span>
                </span>
              </button>
            ) : isSupported && activeDocument.status !== 'uploading' && activeDocument.status !== 'processing' ? (
              <button
                type="button"
                onClick={() => void handleSyncToAI(activeDocument.id, activeDocument.type)}
                disabled={activeDocument.isSyncing}
                className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300">
                  <span className={`material-symbols-outlined text-[16px] ${activeDocument.isSyncing ? 'animate-spin' : ''}`}>{activeDocument.isSyncing ? 'sync' : 'add_circle'}</span>
                </span>
                <span>
                  <span className="block text-sm font-semibold">{activeDocument.isSyncing ? 'Syncing to AI' : 'Sync to AI'}</span>
                  <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">Index this file so the assistant can retrieve it.</span>
                </span>
              </button>
            ) : null}

            {activeDocument.status !== 'uploading' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDocumentMenu(null);
                    setRenameDialog({ doc: activeDocument, value: activeDocument.name, isSaving: false });
                  }}
                  disabled={isBusy}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-300">
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">Rename file</span>
                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">Change the display name for this file.</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDocumentMenu(null);
                    setDeleteDialog({ doc: activeDocument, isDeleting: false });
                  }}
                  disabled={isBusy}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/20"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    <span className={`material-symbols-outlined text-[16px] ${deletingKeysRef.current.has(actionKey) ? 'animate-spin' : ''}`}>
                      {deletingKeysRef.current.has(actionKey) ? 'sync' : 'delete'}
                    </span>
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">Delete file</span>
                    <span className="mt-0.5 block text-xs text-red-500/80 dark:text-red-300/80">Remove this file from storage and synced views.</span>
                  </span>
                </button>
              </>
            )}
          </div>
        );
      })()}
      <NotificationToast key={toast?.id} notification={toast} />
      {renameDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Rename file</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose a clearer name for this file in storage and synced views.</p>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void submitRenameDocument();
              }}
              className="p-5"
            >
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">File name</span>
                <input
                  autoFocus
                  value={renameDialog.value}
                  onChange={(event) => setRenameDialog((current) => current ? { ...current, value: event.target.value } : current)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </label>
              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRenameDialog(null)}
                  disabled={renameDialog.isSaving}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renameDialog.isSaving || renameDialog.value.trim().length === 0}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  {renameDialog.isSaving ? 'Saving...' : 'Save name'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteDialog && (() => {
        const doc = deleteDialog.doc;
        const domain = getDocumentDomain(doc);
        const classification = getDocumentClassification(doc);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-red-100 bg-white shadow-2xl dark:border-red-900/40 dark:bg-slate-950">
              <div className="px-5 pt-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
                    <span className="material-symbols-outlined text-[22px]">delete</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-slate-950 dark:text-slate-100">Delete file?</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      This removes the file from storage and synced file views.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${getFileTone(doc.type)}`}>
                      <span className="material-symbols-outlined text-[18px]">{getFileIcon(doc.type)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100" title={doc.name}>{doc.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{formatBytes(doc.size)}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <span className="uppercase">.{doc.type}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <span>{classification}</span>
                      </div>
                      {domain && (
                        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                          <span className="material-symbols-outlined text-[13px]">category</span>
                          {domain}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeleteDialog(null)}
                  disabled={deleteDialog.isDeleting}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void submitDeleteDocument()}
                  disabled={deleteDialog.isDeleting}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-colors hover:bg-red-700 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-400"
                >
                  <span className={`material-symbols-outlined text-[16px] ${deleteDialog.isDeleting ? 'animate-spin' : ''}`}>
                    {deleteDialog.isDeleting ? 'sync' : 'delete'}
                  </span>
                  {deleteDialog.isDeleting ? 'Deleting...' : 'Delete file'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
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
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{SUPPORTED_KNOWLEDGE_FILE_TYPES_LABEL}</p>
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
                  Uploaded files stay available here. {SUPPORTED_KNOWLEDGE_FILE_TYPES_LABEL} files can be synced to AI when needed.
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

        <div className="flex flex-col gap-4">
          <div className="flex flex-col xl:flex-row gap-4 xl:items-center justify-between">
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

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div ref={displayMenuRef} className="relative w-full sm:w-[212px]">
                <button
                  type="button"
                  onClick={() => setIsDisplayMenuOpen((current) => !current)}
                  className="flex h-[42px] w-full items-center justify-between rounded-lg border border-outline-variant bg-white px-2.5 py-2 text-left shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                  aria-haspopup="menu"
                  aria-expanded={isDisplayMenuOpen}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                      <span className="material-symbols-outlined text-[16px]">{activeDisplayMode.icon}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">View</span>
                      <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{activeDisplayMode.label}</span>
                    </span>
                  </span>
                  <span className={`material-symbols-outlined text-[18px] text-slate-400 transition-transform ${isDisplayMenuOpen ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>

                {isDisplayMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+0.45rem)] z-20 w-full overflow-hidden rounded-lg border border-outline-variant bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-950">
                    {displayModeOptions.map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          setDisplayMode(mode.id);
                          setIsDisplayMenuOpen(false);
                        }}
                        className={`flex w-full items-start gap-3 rounded-md px-2.5 py-2.5 text-left transition-colors ${
                          displayMode === mode.id
                            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                            : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900'
                        }`}
                        role="menuitem"
                      >
                        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                          displayMode === mode.id
                            ? 'bg-white/15 dark:bg-slate-900/10'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
                        }`}>
                          <span className="material-symbols-outlined text-[15px]">{mode.icon}</span>
                        </span>
                        <span>
                          <span className="block text-sm font-semibold">{mode.label}</span>
                          <span className={`mt-0.5 block text-xs ${
                            displayMode === mode.id
                              ? 'text-slate-200 dark:text-slate-700'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            {mode.description}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
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
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-3xl animate-spin text-violet-500">sync</span>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
              <span className="material-symbols-outlined text-3xl">search_off</span>
            </div>
            <h3 className="text-lg font-semibold text-on-surface dark:text-slate-200">No files found</h3>
            <p className="text-on-surface-variant dark:text-slate-400 mt-1">Upload a file or adjust the current filter.</p>
          </div>
        ) : displayMode === 'titles' ? (
          <div className="overflow-hidden rounded-xl border border-outline-variant bg-white dark:border-slate-800 dark:bg-slate-950">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDocs.map(doc => {
                const domain = getDocumentDomain(doc);
                const classification = getDocumentClassification(doc);

                return (
                  <div key={doc.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${getFileTone(doc.type)}`}>
                        <span className="material-symbols-outlined text-[18px]">{getFileIcon(doc.type)}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100" title={doc.name}>{doc.name}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span>{formatBytes(doc.size)}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                          <span>{classification}</span>
                          {domain && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                              <span>{domain}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <StatusBadge status={doc.status} isFileManager={true} />
                      {doc.in_kb && (
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-900/20 dark:text-violet-300">
                          Synced
                        </span>
                      )}
                      {renderSearchVisibilityTag(doc)}
                      {renderDocumentControls(doc)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : displayMode === 'details' ? (
          <div className="overflow-hidden rounded-xl border border-outline-variant bg-white dark:border-slate-800 dark:bg-slate-950">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-900/70">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Domain</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredDocs.map(doc => {
                    const domain = getDocumentDomain(doc);
                    const classification = getDocumentClassification(doc);

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${getFileTone(doc.type)}`}>
                              <span className="material-symbols-outlined text-[18px]">{getFileIcon(doc.type)}</span>
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100" title={doc.name}>{doc.name}</div>
                              <div className="truncate text-xs text-slate-500 dark:text-slate-400">{classification}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{domain || 'Unassigned'}</td>
                        <td className="px-4 py-3 text-sm uppercase text-slate-600 dark:text-slate-300">.{doc.type}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{formatBytes(doc.size)}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{new Date(doc.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={doc.status} isFileManager={true} />
                            {doc.in_kb && (
                              <span className="rounded-full bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-900/20 dark:text-violet-300">
                                Synced
                              </span>
                            )}
                            {renderSearchVisibilityTag(doc)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            {renderDocumentControls(doc)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredDocs.map(doc => {
              const isSupported = isSupportedKnowledgeFileType(doc.type);
              const domain = getDocumentDomain(doc);
              const classification = getDocumentClassification(doc);

              return (
                <div key={doc.id} className="bg-white dark:bg-slate-950 border border-outline-variant dark:border-slate-800 rounded-lg p-5 hover:shadow-md transition-shadow flex flex-col group min-h-[230px]">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getFileTone(doc.type)}`}>
                      <span className="material-symbols-outlined">{getFileIcon(doc.type)}</span>
                    </div>
                    <div className="flex items-center gap-2">
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
                      {renderSearchVisibilityTag(doc)}
                      {renderDocumentControls(doc)}
                    </div>
                  </div>

                  <h4 className="font-semibold text-on-surface dark:text-slate-100 line-clamp-2 min-h-[44px]" title={doc.name}>{doc.name}</h4>

                  <div className="flex items-center gap-3 text-xs text-on-surface-variant dark:text-slate-400 my-4">
                    <span>{formatBytes(doc.size)}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {domain && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300" title="File domain">
                        <span className="material-symbols-outlined text-[14px]">category</span>
                        {domain}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" title="File classification">
                      <span className="material-symbols-outlined text-[14px]">sell</span>
                      {classification}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      .{doc.type}
                    </span>
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
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
