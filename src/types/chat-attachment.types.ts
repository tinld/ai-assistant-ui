export type ChatAttachmentStatus = 'uploading' | 'syncing' | 'ready' | 'failed';

export interface ChatAttachment {
  taskId: string;
  fileId?: string;
  documentId?: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: ChatAttachmentStatus;
  error?: string;
}

export interface ChatAttachmentProgressCallbacks {
  onUploadProgress: (progress: number) => void;
  onSyncStart: (fileId: string) => void;
}

export interface SyncedChatAttachment {
  fileId: string;
  documentId?: string;
  name: string;
  size: number;
  type: string;
}
