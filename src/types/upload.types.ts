export interface UploadTask {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'indexed' | 'failed';
  size: number;
}

export interface UploadState {
  tasks: UploadTask[];
}
