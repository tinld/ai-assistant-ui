import { useRef, useState, type ChangeEvent, type RefObject } from 'react';
import { useDispatch } from 'react-redux';

import { chatAttachmentService, ChatAttachmentError } from '../services/chatAttachmentService';
import type { AppDispatch } from '../store';
import { addUploadTask, updateUploadProgress, updateUploadStatus } from '../store/uploadSlice';
import type { ChatAttachment } from '../types/chat-attachment.types';

interface UseChatAttachmentResult {
  attachment: ChatAttachment | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  isAttachmentBusy: boolean;
  openFilePicker: () => void;
  clearAttachment: () => void;
  handleFileSelection: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
}

const createTaskId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `attachment-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof ChatAttachmentError || error instanceof Error) {
    return error.message;
  }

  return 'Could not attach this file. Please try again.';
};

export const useChatAttachment = (token: string | null): UseChatAttachmentResult => {
  const dispatch = useDispatch<AppDispatch>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);

  const clearAttachment = (): void => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openFilePicker = (): void => {
    fileInputRef.current?.click();
  };

  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const taskId = createTaskId();
    let uploadCompleted = false;

    try {
      const fileType = chatAttachmentService.validateFile(file);
      if (!token) throw new ChatAttachmentError('Please sign in again before attaching a file.');

      setAttachment({ taskId, name: file.name, size: file.size, type: fileType, progress: 0, status: 'uploading' });
      dispatch(addUploadTask({ id: taskId, name: file.name, size: file.size, progress: 0, status: 'uploading' }));

      const syncedFile = await chatAttachmentService.uploadAndSync(file, token, {
        onUploadProgress: (progress) => {
          setAttachment((current) => current ? { ...current, progress } : null);
          dispatch(updateUploadProgress({ id: taskId, progress }));
        },
        onSyncStart: (fileId) => {
          uploadCompleted = true;
          setAttachment((current) => current ? { ...current, fileId, progress: 100, status: 'syncing' } : null);
          dispatch(updateUploadStatus({ id: taskId, status: 'processing' }));
        },
      });

      setAttachment((current) => current ? {
        ...current,
        ...syncedFile,
        progress: 100,
        status: 'ready',
      } : null);
      dispatch(updateUploadStatus({ id: taskId, status: 'indexed' }));
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setAttachment({
        taskId,
        name: file.name,
        size: file.size,
        type: file.name.split('.').pop()?.toLowerCase() ?? 'file',
        progress: uploadCompleted ? 100 : 0,
        status: 'failed',
        error: message,
      });

      if (uploadCompleted) {
        dispatch(updateUploadStatus({ id: taskId, status: 'uploaded' }));
      } else {
        dispatch(updateUploadStatus({ id: taskId, status: 'failed' }));
      }
    }
  };

  return {
    attachment,
    fileInputRef,
    isAttachmentBusy: attachment?.status === 'uploading' || attachment?.status === 'syncing',
    openFilePicker,
    clearAttachment,
    handleFileSelection,
  };
};
