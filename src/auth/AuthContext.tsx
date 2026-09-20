import { createContext, useContext } from 'react';
import type { AuthUser } from '../platform/auth/WebAuthAdapter';

export const AuthContext = createContext<{ user: AuthUser; logout: () => Promise<void> } | null>(null);
export const useAuth = () => useContext(AuthContext);
