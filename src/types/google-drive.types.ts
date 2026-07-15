export interface GoogleDriveStatus {
  success: boolean;
  configured: boolean;
  connected: boolean;
  reconnectRequired?: boolean;
  connectionStatus?: 'connected' | 'expired' | 'disconnected';
  email?: string | null;
  connectedAt?: string | null;
  lastSyncedAt?: string | null;
}

export interface GoogleDriveConnectResponse {
  success: boolean;
  authorization_url: string;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  modifiedTime?: string | null;
  md5Checksum?: string | null;
  webViewLink?: string | null;
  iconLink?: string | null;
  isGoogleWorkspaceFile?: boolean;
  isFolder?: boolean;
  isSupported?: boolean;
}

export interface GoogleDriveFilesResponse {
  success: boolean;
  files: GoogleDriveFile[];
  nextPageToken?: string | null;
}

export interface GoogleDriveSyncResponse {
  success: boolean;
  unchanged?: boolean;
  updated?: boolean;
  file?: {
    id: string;
    name: string;
    size: number;
    status?: string;
  };
  sync?: {
    success?: boolean;
    document_id?: string;
  };
}
