export interface GmailStatus {
  success: boolean;
  configured: boolean;
  connected: boolean;
  email?: string | null;
  connectedAt?: string | null;
}

export interface GmailConnectResponse {
  success: boolean;
  authorization_url: string;
}
