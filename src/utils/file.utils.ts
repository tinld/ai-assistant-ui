import { SUPPORTED_KNOWLEDGE_FILE_TYPES } from '../constants/file.constants';

export const getFileExtension = (fileName: string): string =>
  fileName.split('.').pop()?.toLowerCase() ?? 'unknown';

export const isSupportedKnowledgeFileType = (fileType: string): boolean =>
  SUPPORTED_KNOWLEDGE_FILE_TYPES.some((supportedType) => supportedType === fileType);

export const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf': return 'picture_as_pdf';
    case 'doc': 
    case 'docx': return 'description';
    case 'csv': return 'table_chart';
    case 'png': 
    case 'jpg': 
    case 'jpeg': return 'image';
    case 'url': return 'link';
    default: return 'insert_drive_file';
  }
};
