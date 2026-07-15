import { api } from './api';
import type { GmailConnectResponse, GmailStatus } from '../types/gmail.types';

export const gmailApi = {
  getStatus: async (token?: string | null): Promise<GmailStatus> => (
    api.get<GmailStatus>('/api/integrations/gmail/status', token)
  ),
  connect: async (token?: string | null): Promise<GmailConnectResponse> => (
    api.post<GmailConnectResponse>('/api/integrations/gmail/connect', {}, token)
  ),
  disconnect: async (token?: string | null): Promise<{ success: boolean; message?: string }> => (
    api.post<{ success: boolean; message?: string }>('/api/integrations/gmail/disconnect', {}, token)
  ),
};
