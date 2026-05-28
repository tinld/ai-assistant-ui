export interface KBDocument {
  id: string;
  documentId?: string;
  kbDocumentId?: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  status: 'indexed' | 'processing' | 'failed' | 'uploading';
  progress?: number;
  tags?: string[];
  searchEnabled?: boolean;
  isTogglingSearch?: boolean;
}

export interface Fact {
  id: string;
  text: string;
  domain: string;
  source: string;
  timestamp: string;
}