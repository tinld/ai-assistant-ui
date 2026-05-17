import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fileManagerApi } from '../services/fileManagerApi';
import type { RootState } from '../store';
import { Navigate } from 'react-router-dom';
import { addUploadTask, updateUploadProgress, updateUploadStatus } from '../store/uploadSlice';
import type { FileManagerDocument } from '../types/file.types';
import { formatBytes } from '../utils/formatters';
import { getFileIcon } from '../utils/file.utils';
import { StatusBadge } from '../components/StatusBadge';

export const FileManager: React.FC = () => {
  const [documents, setDocuments] = useState<FileManagerDocument[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
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
      const res = await fileManagerApi.getFiles(token);
      if (res && res.data && res.data.files) {
        const loadedDocs: FileManagerDocument[] = res.data.files.map(f => ({
          ...f,
          type: f.name.split('.').pop()?.toLowerCase() || 'unknown',
          status: 'indexed'
        }));
        setDocuments(loadedDocs);
        return loadedDocs;
      }
    } catch (err) {
      console.error("Failed to load files", err);
      setError("Failed to load files.");
      return [];
    } finally {
      setLoading(false);
    }
    return [];
  };

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
      // Refresh list to ensure we get the correct filename (e.g., test (1).pdf) from backend
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

  const handleSyncToKB = async (docId: string, docType: string) => {
    const supported = ['pdf', 'doc', 'docx', 'csv', 'txt'];
    if (!supported.includes(docType)) {
      setError(`Cannot sync .${docType} files to Knowledge Base. Supported: PDF, DOCX, CSV, TXT.`);
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



  return (
    <div className="flex-1 bg-surface-bright dark:bg-slate-900 overflow-y-auto font-['Inter']">
      <div className="max-w-6xl mx-auto px-8 py-8 flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-on-surface dark:text-slate-200">File Manager</h1>
            <p className="text-on-surface-variant dark:text-slate-400 mt-1">Manage your general files stored on the cloud.</p>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-primary dark:bg-violet-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-violet-700 active:scale-95 transition-all shadow-sm"
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

        {/* Drag & Drop Zone */}
        <div 
          className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all duration-200 ${
            isDragging 
              ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 scale-[1.02]' 
              : 'border-outline-variant dark:border-slate-700 hover:border-violet-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${isDragging ? 'bg-violet-200 dark:bg-violet-800 text-violet-700 dark:text-violet-300' : 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'}`}>
            <span className="material-symbols-outlined text-3xl">cloud_upload</span>
          </div>
          <h3 className="text-lg font-bold text-on-surface dark:text-slate-200">Drag & drop files here</h3>
          <p className="text-on-surface-variant dark:text-slate-400 mt-1 mb-4 text-center max-w-md">
            Support all file types up to 50MB each.
          </p>
          <button onClick={() => fileInputRef.current?.click()} className="text-violet-600 dark:text-violet-400 font-medium hover:underline cursor-pointer">Browse files from computer</button>
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

        {/* Document Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(() => {
            // Merge uploading tasks from Redux
            const uploadingDocs: FileManagerDocument[] = uploadTasks
              .filter(t => t.status === 'uploading' || t.status === 'failed')
              .map(t => ({
                id: t.id,
                name: t.name,
                size: t.size,
                created_at: new Date().toISOString(),
                type: t.name.split('.').pop()?.toLowerCase() || 'unknown',
                status: t.status,
                progress: t.progress
              }));
              
            const displayDocs = [...uploadingDocs, ...documents];
            
            if (loading) {
              return (
                 <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                   <span className="material-symbols-outlined text-3xl animate-spin text-violet-500">sync</span>
                 </div>
              );
            }
            
            if (displayDocs.length === 0) {
              return (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
                    <span className="material-symbols-outlined text-3xl">search_off</span>
                  </div>
                  <h3 className="text-lg font-semibold text-on-surface dark:text-slate-200">No files uploaded yet</h3>
                  <p className="text-on-surface-variant dark:text-slate-400 mt-1">Upload files using the drag & drop zone above.</p>
                </div>
              );
            }
            
            return displayDocs.map(doc => (
            <div key={doc.id} className="bg-white dark:bg-slate-950 border border-outline-variant dark:border-slate-800 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col group">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  doc.type === 'pdf' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                  (doc.type === 'doc' || doc.type === 'docx') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                  doc.type === 'csv' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                  'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                }`}>
                  <span className="material-symbols-outlined">{getFileIcon(doc.type)}</span>
                </div>
              </div>
              
              <h4 className="font-semibold text-on-surface dark:text-slate-200 line-clamp-1 mb-1" title={doc.name}>{doc.name}</h4>
              
              <div className="flex items-center gap-3 text-xs text-on-surface-variant dark:text-slate-400 mb-4 mt-auto">
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
                  <div className="flex items-center justify-between">
                    <StatusBadge status={doc.status} isFileManager={true} />
                    {doc.status === 'failed' && (
                      <button className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium">Retry</button>
                    )}
                    {doc.status === 'indexed' && (
                      doc.in_kb ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 px-2 py-1 bg-violet-50 dark:bg-violet-900/20 rounded-full" title="In Knowledge Base">
                          <span className="material-symbols-outlined text-[14px]">psychiatry</span>
                          AI Synced
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleSyncToKB(doc.id, doc.type)}
                          disabled={doc.isSyncing}
                          className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400 disabled:opacity-50 transition-colors"
                          title="Sync to Knowledge Base"
                        >
                          {doc.isSyncing ? (
                            <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                          ) : (
                            <span className="material-symbols-outlined text-[14px]">sync</span>
                          )}
                          {doc.isSyncing ? 'Syncing...' : 'Sync to AI'}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          ))})()}
        </div>

      </div>
    </div>
  );
};
