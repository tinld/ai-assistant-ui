const MEGABYTE_IN_BYTES = 1024 * 1024;

export const CHAT_ATTACHMENT_MAX_SIZE_BYTES = 20 * MEGABYTE_IN_BYTES;
export const CHAT_ATTACHMENT_MAX_SIZE_LABEL = '20MB';
export const FILE_MANAGER_UPLOAD_MAX_SIZE_BYTES = 50 * MEGABYTE_IN_BYTES;
export const FILE_MANAGER_UPLOAD_MAX_SIZE_LABEL = '50MB';

export const SUPPORTED_KNOWLEDGE_FILE_TYPES = [
  'pdf',
  'doc',
  'docx',
  'csv',
  'txt',
  'md',
] as const;

export const CHAT_ATTACHMENT_ACCEPT = SUPPORTED_KNOWLEDGE_FILE_TYPES
  .map((type) => `.${type}`)
  .join(',');

export const SUPPORTED_KNOWLEDGE_FILE_TYPES_LABEL = SUPPORTED_KNOWLEDGE_FILE_TYPES
  .map((type) => type.toUpperCase())
  .join(', ');
