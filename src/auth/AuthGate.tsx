import React, { lazy, Suspense, useEffect, useState } from 'react';
import { authService, type AuthResult } from '../platform/auth/WebAuthAdapter';
import { activateAccountStorage } from '../platform/storage/accountScope';
import { AuthContext } from './AuthContext';
import { LoginView } from './LoginView';
const PrivateApp = lazy(() => import('../App'));
type State = 'loading'|'authenticated'|'anonymous'|'error';
export function AuthGate() {
  const [state, setState] = useState<State>('loading'); const [session, setSession] = useState<AuthResult | null>(null); const [error, setError] = useState(''); const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const load = async () => { setState('loading'); setError(''); const token = authService.consumeRecoveryToken(); if (token) setRecoveryToken(token); try { const result = await authService.request('session'); setSession(result); setState(result.user ? 'authenticated' : 'anonymous'); } catch (err) { const message = err instanceof Error ? err.message : ''; if (token || recoveryToken || message.includes('请先登录')) { setSession({ user: null }); setState('anonymous'); return; } setError(message || '账户服务暂时不可用'); setState('error'); } };
  useEffect(() => { void load(); return authService.onOtherSessionChanged(() => { void load(); }); }, []);
  if (state === 'loading') return <main className="auth-screen"><p role="status">正在载入你的唱片空间…</p></main>;
  if (state === 'error') return <main className="auth-screen"><p className="auth-error" role="alert">{error}</p><button className="auth-submit" onClick={() => void load()}>重试</button></main>;
  if (state === 'anonymous' || recoveryToken) return <LoginView recoveryToken={recoveryToken} onAuthenticated={result => { setRecoveryToken(null); setSession(result); setState(result.user ? 'authenticated' : 'anonymous'); authService.notifySessionChanged(); }} />;
  if (!session?.user) return null;
  activateAccountStorage(session.user.id);
  const logout = async () => { await authService.request('logout'); authService.notifySessionChanged(); await load(); };
  const changePassword = async (currentPassword: string, newPassword: string) => { await authService.request('password', { currentPassword, newPassword }); authService.notifySessionChanged(); await load(); };
  return <AuthContext.Provider value={{ user: session.user, logout, changePassword }}><Suspense fallback={<main className="auth-screen"><p role="status">正在打开本机馆藏…</p></main>}><PrivateApp /></Suspense></AuthContext.Provider>;
}
