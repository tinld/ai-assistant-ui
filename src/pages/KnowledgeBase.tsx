import React, { useState } from 'react';

interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'url' | 'csv';
  size: string;
  uploadDate: string;
  status: 'indexed' | 'processing' | 'failed';
}

const MOCK_DOCUMENTS: Document[] = [
  { id: '1', name: 'Q3_Financial_Report_2024.pdf', type: 'pdf', size: '2.4 MB', uploadDate: 'Oct 24, 2024', status: 'indexed' },
  { id: '2', name: 'Employee_Handbook_v2.doc', type: 'doc', size: '1.1 MB', uploadDate: 'Oct 20, 2024', status: 'indexed' },
  { id: '3', name: 'Customer_Feedback_Q3.csv', type: 'csv', size: '840 KB', uploadDate: 'Oct 26, 2024', status: 'processing' },
  { id: '4', name: 'https://company-wiki.internal/marketing', type: 'url', size: '--', uploadDate: 'Oct 15, 2024', status: 'indexed' },
  { id: '5', name: 'Competitor_Analysis.pdf', type: 'pdf', size: '4.2 MB', uploadDate: 'Oct 25, 2024', status: 'failed' },
  { id: '6', name: 'API_Documentation_Draft.doc', type: 'doc', size: '3.5 MB', uploadDate: 'Oct 27, 2024', status: 'processing' },
];

export const KnowledgeBase: React.FC = () => {
  const [filter, setFilter] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

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
      default:
        return null;
    }
  };

  const filteredDocs = MOCK_DOCUMENTS.filter(doc => {
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
          <button className="flex items-center gap-2 bg-primary dark:bg-violet-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-violet-700 active:scale-95 transition-all shadow-sm">
            <span className="material-symbols-outlined text-sm">upload</span>
            Upload Files
          </button>
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
              ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' 
              : 'border-outline-variant dark:border-slate-700 hover:border-violet-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
        >
          <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl">cloud_upload</span>
          </div>
          <h3 className="text-lg font-bold text-on-surface dark:text-slate-200">Drag & drop files here</h3>
          <p className="text-on-surface-variant dark:text-slate-400 mt-1 mb-4 text-center max-w-md">
            Support PDF, DOCX, CSV, and TXT files up to 50MB each. Documents will be automatically indexed for AI retrieval.
          </p>
          <button className="text-violet-600 dark:text-violet-400 font-medium hover:underline">Browse files from computer</button>
        </div>

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
              
              <div className="flex items-center gap-3 text-xs text-on-surface-variant dark:text-slate-400 mb-4">
                <span>{doc.size}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                <span>{doc.uploadDate}</span>
              </div>
              
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                {getStatusBadge(doc.status)}
                
                {doc.status === 'failed' && (
                  <button className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium">Retry</button>
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
