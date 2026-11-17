// ============================================================
// BrewLite Authentication Types & Interfaces
// Matching Figma design specs (IUwGwAon8cvD3CtxHPsfHW)
// ============================================================

export type UserRole = 'CUSTOMER' | 'BARISTA' | 'ADMIN';

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  role: UserRole | string;
  avatarUrl?: string;
  points?: number;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export type AuthMode = 'signin' | 'signup' | 'forgot' | 'confirm';

export interface FastLoginAccount {
  label: string;
  roleLabel: string;
  email: string;
  password: string;
  badgeColor?: string;
}
