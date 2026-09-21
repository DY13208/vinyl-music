import { createContext, useContext } from 'react';
import type { AuthUser } from '../platform/auth/WebAuthAdapter';
export type AuthContextValue = { user: AuthUser; logout: () => Promise<void>; changePassword: (currentPassword: string, newPassword: string) => Promise<void> };
export const AuthContext = createContext<AuthContextValue | null>(null);
export const useAuth = () => useContext(AuthContext);
