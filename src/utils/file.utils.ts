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
