export interface KBDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  status: 'indexed' | 'processing' | 'failed' | 'uploading';
  progress?: number;
  tags?: string[];
}

export interface Fact {
  id: string;
  text: string;
  domain: string;
  source: string;
  timestamp: string;
}
