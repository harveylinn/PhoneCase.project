import { createContext, useContext } from 'react';
import type { MemberInfo, ProfileUpdate } from '../types/member';

export type AuthStatus = 'checking' | 'guest' | 'authenticated' | 'error';
interface AuthValue {
  currentMember: MemberInfo | null;
  status: AuthStatus;
  error: string;
  login: (account: string, password: string) => Promise<void>;
  logout: () => void;
  retry: () => void;
  updateProfile: (input: ProfileUpdate) => Promise<void>;
}
export const AuthContext = createContext<AuthValue | null>(null);

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth 必須在 AuthProvider 內使用。');
  return auth;
}
