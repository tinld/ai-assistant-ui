export interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'CRM' | 'Storage' | 'Communication' | 'Database' | 'API';
  icon: string;
  iconBgClass: string;
  iconTextClass: string;
  isConnected: boolean;
}
