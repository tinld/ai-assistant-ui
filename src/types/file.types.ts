export interface FileItem {
  id: string;
  name: string;
  size: number;
  created_at: string;
  in_kb?: boolean;
}

export interface FileManagerDocument extends FileItem {
  type: string;
  status: 'indexed' | 'processing' | 'failed' | 'uploading';
  progress?: number;
  isSyncing?: boolean;
}
