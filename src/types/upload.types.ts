export interface UploadTask {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'processing' | 'uploaded' | 'indexed' | 'failed';
  size: number;
}

export interface UploadState {
  tasks: UploadTask[];
}
