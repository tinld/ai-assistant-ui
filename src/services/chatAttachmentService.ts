import {
  CHAT_ATTACHMENT_MAX_SIZE_BYTES,
  CHAT_ATTACHMENT_MAX_SIZE_LABEL,
  SUPPORTED_KNOWLEDGE_FILE_TYPES_LABEL,
} from '../constants/file.constants';
import type {
  ChatAttachmentProgressCallbacks,
  SyncedChatAttachment,
} from '../types/chat-attachment.types';
import { getFileExtension, isSupportedKnowledgeFileType } from '../utils/file.utils';
import { fileManagerApi } from './fileManagerApi';

export class ChatAttachmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatAttachmentError';
  }
}

const validateFile = (file: File): string => {
  if (file.size > CHAT_ATTACHMENT_MAX_SIZE_BYTES) {
    throw new ChatAttachmentError(`File must be ${CHAT_ATTACHMENT_MAX_SIZE_LABEL} or smaller.`);
  }

  const fileType = getFileExtension(file.name);
  if (!isSupportedKnowledgeFileType(fileType)) {
    throw new ChatAttachmentError(`Unsupported file type. Use ${SUPPORTED_KNOWLEDGE_FILE_TYPES_LABEL}.`);
  }

  return fileType;
};

const uploadAndSync = async (
  file: File,
  token: string,
  callbacks: ChatAttachmentProgressCallbacks,
): Promise<SyncedChatAttachment> => {
  const fileType = validateFile(file);
  const uploadResponse = await fileManagerApi.uploadFile(file, token, callbacks.onUploadProgress);
  const uploadedFile = uploadResponse.file;

  if (!uploadedFile?.id) {
    throw new ChatAttachmentError('Upload completed without a file identifier.');
  }

  callbacks.onSyncStart(uploadedFile.id);
  const syncResponse = await fileManagerApi.syncToKnowledgeBase(uploadedFile.id, token);
  if (!syncResponse.document_id) {
    throw new ChatAttachmentError('The file was uploaded but could not be synced to knowledge.');
  }

  return {
    fileId: uploadedFile.id,
    documentId: syncResponse.document_id,
    name: uploadedFile.name || file.name,
    size: uploadedFile.size || file.size,
    type: fileType,
  };
};

export const chatAttachmentService = {
  validateFile,
  uploadAndSync,
};
