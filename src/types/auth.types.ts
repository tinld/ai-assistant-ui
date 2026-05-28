export interface User {
  id: string | number;
  email: string;
  full_name?: string;
  [key: string]: unknown;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  authNotice: string | null;
}
