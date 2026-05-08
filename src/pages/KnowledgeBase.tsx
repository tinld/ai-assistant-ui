import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { knowledgeBaseApi } from '../services/kbApi';
import type { RootState } from '../store';
import { Navigate } from 'react-router-dom';

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  status: 'indexed' | 'processing' | 'failed' | 'uploading';
  progress?: number;
  tags?: string[];
}

export const KnowledgeBase: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = useSelector((state: RootState) => state.auth.token);

  useEffect(() => {
    if (token) {
      loadDocuments();
    }
  }, [token]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await knowledgeBaseApi.getDocuments(token);
      if (res && res.data && res.data.documents) {
        const loadedDocs: Document[] = res.data.documents.map((d: any) => ({
          id: d.id,
          name: d.name,
          type: d.name.split('.').pop()?.toLowerCase() || 'unknown',
          size: formatBytes(d.size),
          uploadDate: new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          status: d.status,
          tags: d.domain ? [d.domain] : ['General']
        }));
        // Remove currently successfully loaded ones from local mock state
        setDocuments(prev => {
          const uploadingDocs = prev.filter(p => p.status === 'uploading' || p.status === 'failed');
          return [...uploadingDocs, ...loadedDocs];
        });
      }
    } catch (err) {
      console.error("Failed to load knowledge base documents", err);
      setError("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    
    // Process first file (could be expanded to multiple later)
    const file = files[0];
    
    // Validate size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError(`File "${file.name}" exceeds the 50MB limit.`);
      return;
    }

    const newDocId = Math.random().toString(36).substr(2, 9);
    const newDoc: Document = {
      id: newDocId,
      name: file.name,
      type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
      size: formatBytes(file.size),
      uploadDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'uploading',
      progress: 0
    };

    setDocuments(prev => [newDoc, ...prev]);

    knowledgeBaseApi.uploadDocument(file, token, (progress) => {
      setDocuments(prev => prev.map(d => d.id === newDocId ? { ...d, progress } : d));
    }).then(() => {
      // Refresh documents from backend after upload completes
      setDocuments(prev => prev.filter(d => d.id !== newDocId));
      loadDocuments();
    }).catch(() => {
      setDocuments(prev => prev.map(d => d.id === newDocId ? { ...d, status: 'failed', progress: undefined } : d));
      setError('Upload failed. Please try again.');
    });
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

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return 'picture_as_pdf';
      case 'doc': return 'description';
      case 'csv': return 'table_chart';
      case 'url': return 'link';
      default: return 'insert_drive_file';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'indexed':
        return <span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">check_circle</span> Indexed</span>;
      case 'processing':
        return <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium flex items-center gap-1"><span className="material-symbols-outlined text-[14px] animate-spin">sync</span> Processing</span>;
      case 'failed':
        return <span className="px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> Failed</span>;
      case 'uploading':
        return <span className="px-2 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-medium flex items-center gap-1"><span className="material-symbols-outlined text-[14px] animate-pulse">cloud_upload</span> Uploading</span>;
      default:
        return null;
    }
  };

  const filteredDocs = documents.filter(doc => {
    if (filter !== 'All' && doc.type !== filter.toLowerCase()) return false;
    if (search && !doc.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex-1 bg-surface-bright dark:bg-slate-900 overflow-y-auto font-['Inter']">
      <div className="max-w-6xl mx-auto px-8 py-8 flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-on-surface dark:text-slate-200">Knowledge Base</h1>
            <p className="text-on-surface-variant dark:text-slate-400 mt-1">Manage documents, URLs, and data sources for your AI Assistant's context.</p>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-primary dark:bg-violet-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-violet-700 active:scale-95 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">upload</span>
            Upload Files
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            hidden 
            onChange={(e) => processFiles(e.target.files)} 
            accept=".pdf,.doc,.docx,.csv,.txt"
          />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-950 border border-outline-variant dark:border-slate-800 rounded-xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <span className="material-symbols-outlined">description</span>
            </div>
            <div>
              <p className="text-sm text-on-surface-variant dark:text-slate-400 font-medium">Total Documents</p>
              <h3 className="text-2xl font-bold text-on-surface dark:text-slate-200">248</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-950 border border-outline-variant dark:border-slate-800 rounded-xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <span className="material-symbols-outlined">storage</span>
            </div>
            <div>
              <p className="text-sm text-on-surface-variant dark:text-slate-400 font-medium">Storage Used</p>
              <h3 className="text-2xl font-bold text-on-surface dark:text-slate-200">1.2 GB <span className="text-sm font-normal text-slate-400">/ 5 GB</span></h3>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-950 border border-outline-variant dark:border-slate-800 rounded-xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <div>
              <p className="text-sm text-on-surface-variant dark:text-slate-400 font-medium">Processed & Indexed</p>
              <h3 className="text-2xl font-bold text-on-surface dark:text-slate-200">98%</h3>
            </div>
          </div>
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
            Support PDF, DOCX, CSV, and TXT files up to 50MB each. Documents will be automatically indexed for AI retrieval.
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

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-2">
          <div className="flex flex-wrap gap-2">
            {['All', 'PDF', 'DOC', 'CSV', 'URL'].map(tab => (
              <button 
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === tab 
                    ? 'bg-violet-600 text-white' 
                    : 'bg-white dark:bg-slate-950 border border-outline-variant dark:border-slate-800 text-on-surface-variant dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input 
              type="text" 
              placeholder="Search documents..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-outline-variant dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:text-slate-200 dark:placeholder-slate-500"
            />
          </div>
        </div>

        {/* Document Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map(doc => (
            <div key={doc.id} className="bg-white dark:bg-slate-950 border border-outline-variant dark:border-slate-800 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col group">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  doc.type === 'pdf' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                  doc.type === 'doc' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                  doc.type === 'csv' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                  'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                }`}>
                  <span className="material-symbols-outlined">{getFileIcon(doc.type)}</span>
                </div>
                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
              
              <h4 className="font-semibold text-on-surface dark:text-slate-200 line-clamp-1 mb-1" title={doc.name}>{doc.name}</h4>
              
              <div className="flex flex-wrap gap-1.5 mb-3 min-h-[20px]">
                {doc.tags?.map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3 text-xs text-on-surface-variant dark:text-slate-400 mb-4 mt-auto">
                <span>{doc.size}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                <span>{doc.uploadDate}</span>
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
                    {getStatusBadge(doc.status)}
                    {doc.status === 'failed' && (
                      <button className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium">Retry</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {filteredDocs.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
                <span className="material-symbols-outlined text-3xl">search_off</span>
              </div>
              <h3 className="text-lg font-semibold text-on-surface dark:text-slate-200">No documents found</h3>
              <p className="text-on-surface-variant dark:text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
