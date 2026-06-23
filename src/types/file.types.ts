export interface FileMetadata {
  classification?: string | string[] | null;
  category?: string | null;
  document_type?: string | null;
  file_type?: string | null;
  mime_type?: string | null;
  content_type?: string | null;
  domain?: string | null;
  tags?: string[];
}

export interface FileItem {
  id: string;
  source_file_id?: string | null;
  name: string;
  size: number;
  created_at: string;
  in_kb?: boolean;
  document_id?: string | null;
  kb_document_id?: string | null;
  search_enabled?: boolean;
  status?: 'indexed' | 'processing' | 'failed' | 'uploading' | 'uploaded';
  classification?: string | string[] | null;
  category?: string | null;
  document_type?: string | null;
  file_type?: string | null;
  mime_type?: string | null;
  content_type?: string | null;
  domain?: string | null;
  tags?: string[];
  metadata?: FileMetadata | null;
}

export interface FileUploadResponse {
  success: boolean;
  file: FileItem;
}

export interface FileSyncResponse {
  success?: boolean;
  document_id?: string;
  search_enabled?: boolean;
  file?: Partial<FileItem>;
}

export interface FileManagerDocument extends FileItem {
  type: string;
  status: 'indexed' | 'processing' | 'failed' | 'uploading' | 'uploaded';
  progress?: number;
  isSyncing?: boolean;
  isTogglingSearch?: boolean;
}
