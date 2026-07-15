import { api } from './api';
import { fileManagerApi } from './fileManagerApi';
import { googleDriveApi } from './googleDriveApi';
import type { ChatSourceCapabilitiesResponse } from '../types/chat-source.types';
import type { FileItem } from '../types/file.types';

const isEligibleChatFile = (file: FileItem): boolean => (
  file.in_kb === true
  && file.search_enabled !== false
  && file.status === 'indexed'
  && Boolean(file.document_id || file.kb_document_id)
);

export const chatSourceService = {
  getCapabilities: async (token?: string | null): Promise<ChatSourceCapabilitiesResponse> => (
    api.get<ChatSourceCapabilitiesResponse>('/api/chat/source-capabilities', token)
  ),

  getEligibleFiles: async (token?: string | null): Promise<FileItem[]> => {
    const response = await fileManagerApi.getFiles(token);
    return response.data.files.filter(isEligibleChatFile);
  },

  listDriveFiles: googleDriveApi.listFiles,
  syncDriveFile: googleDriveApi.syncFile,
};
