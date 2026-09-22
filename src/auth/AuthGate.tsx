import React, { lazy, Suspense, useEffect, useState } from 'react';
import { authService, type AuthResult } from '../platform/auth/WebAuthAdapter';
import { activateAccountStorage } from '../platform/storage/accountScope';
import { AuthContext } from './AuthContext';
import { LoginView } from './LoginView';
import { VinylLoadingScreen } from '../components/VinylLoadingScreen';

// Import only after the server has verified the account and storage is scoped.
const PrivateApp = lazy(() => import('../App'));
let initialSession: Promise<AuthResult> | undefined;
function loadSession() {
  if (!initialSession) {
    const link = authService.consumeEmailLink();
    initialSession = link ? authService.request('verify', link).then(result => { authService.notifySessionChanged(); return result; }) : authService.request('session');
  }
  return initialSession;
}

export function AuthGate() {
  const [session, setSession] = useState<AuthResult | null>(null);
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    let alive = true;
    void loadSession().then(value => { if (alive) setSession(value); }).catch(error => { if (alive) { setError(error.message); setSession({ user: null }); } });
    const unsubscribe = authService.onOtherSessionChanged(() => {
      setLocked(true);
      authService.reload();
    });
    return () => { alive = false; unsubscribe(); };
  }, []);
  if (!session || locked) return <VinylLoadingScreen />;
  if (!session.user || session.recovery) return <LoginView initialError={error} recovery={!!session.recovery} onAuthenticated={value => {
    setError(''); setSession(value); authService.notifySessionChanged();
  }} />;
  activateAccountStorage(session.user.id);
  const logout = async () => {
    await authService.request('logout', {});
    setLocked(true);
    authService.notifySessionChanged();
    authService.reload();
  };
  return <AuthContext.Provider value={{ user: session.user, logout }}><Suspense fallback={<VinylLoadingScreen message="正在打开本机馆藏" />}><PrivateApp /></Suspense></AuthContext.Provider>;
}
