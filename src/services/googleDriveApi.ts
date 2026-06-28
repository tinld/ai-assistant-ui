import { api } from './api';

import type {
  GoogleDriveConnectResponse,
  GoogleDriveFilesResponse,
  GoogleDriveStatus,
  GoogleDriveSyncResponse,
} from '../types/google-drive.types';

export const googleDriveApi = {
  getStatus: async (token?: string | null): Promise<GoogleDriveStatus> => (
    api.get<GoogleDriveStatus>('/api/integrations/google-drive/status', token)
  ),

  connect: async (token?: string | null): Promise<GoogleDriveConnectResponse> => (
    api.post<GoogleDriveConnectResponse>('/api/integrations/google-drive/connect', {}, token)
  ),

  disconnect: async (token?: string | null): Promise<{ success: boolean; message?: string }> => (
    api.post<{ success: boolean; message?: string }>('/api/integrations/google-drive/disconnect', {}, token)
  ),

  listFiles: async (
    token?: string | null,
    query?: string,
    pageToken?: string | null
  ): Promise<GoogleDriveFilesResponse> => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (pageToken) params.set('pageToken', pageToken);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return api.get<GoogleDriveFilesResponse>(`/api/google-drive/files${suffix}`, token);
  },

  syncFile: async (
    driveFileId: string,
    syncToKb: boolean,
    token?: string | null
  ): Promise<GoogleDriveSyncResponse> => (
    api.post<GoogleDriveSyncResponse>('/api/google-drive/sync', {
      drive_file_id: driveFileId,
      sync_to_kb: syncToKb,
    }, token)
  ),
};
