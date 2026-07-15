export type ChatSourceProvider = 'google_drive' | 'files' | 'gmail';

export interface ChatSourceCapability {
  provider: ChatSourceProvider;
  mention: 'Drive' | 'Files' | 'Gmail';
  connected: boolean;
  selectable: boolean;
  reconnect_required?: boolean;
  connection_status?: 'connected' | 'expired' | 'disconnected';
  account_label?: string | null;
  eligible_count?: number;
}

export interface ChatSourceSelection {
  client_id?: string;
  provider: ChatSourceProvider;
  resource_type: 'document' | 'mailbox';
  resource_id?: string;
  label: string;
}

export interface ChatSourceReference {
  provider?: ChatSourceProvider;
  document_id?: string | null;
  chunk_id?: string | null;
  source_file_id?: string | null;
  label: string;
  message_id?: string | null;
  thread_id?: string | null;
  sender?: string | null;
  received_at?: string | null;
  web_url?: string | null;
}

export interface ChatSourceCapabilitiesResponse {
  success: boolean;
  sources: ChatSourceCapability[];
}
