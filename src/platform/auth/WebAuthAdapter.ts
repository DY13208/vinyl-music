export type AuthUser = { id: string; username: string; displayName: string };
export type AuthResult = { user?: AuthUser | null; csrfToken?: string; expiresAt?: string; message?: string; recovery?: boolean };
export type AuthAction = 'session'|'register'|'login'|'logout'|'password'|'recovery-request'|'recovery-confirm';

export class WebAuthAdapter {
  private csrfToken: string | null = null;
  private channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('vinyl-account-session');
  private paths: Record<AuthAction, string> = {
    session: '/api/v1/auth/session', register: '/api/v1/auth/register', login: '/api/v1/auth/login', logout: '/api/v1/auth/logout', password: '/api/v1/auth/password', 'recovery-request': '/api/v1/auth/password/recovery/request', 'recovery-confirm': '/api/v1/auth/password/recovery/confirm',
  };
  async request(action: AuthAction, payload?: Record<string, unknown>): Promise<AuthResult> {
    const controller = new AbortController(); const timer = window.setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(this.paths[action], { method: action === 'session' ? 'GET' : action === 'password' ? 'PUT' : 'POST', credentials: 'include', cache: 'no-store', signal: controller.signal, headers: payload ? { 'Content-Type': 'application/json', ...(this.csrfToken ? { 'X-CSRF-Token': this.csrfToken } : {}) } : this.csrfToken && action === 'logout' ? { 'X-CSRF-Token': this.csrfToken } : undefined, body: payload ? JSON.stringify(payload) : undefined });
      const value = await response.json().catch(() => ({}));
      if (!response.ok) { const error = value?.error; throw new Error(error?.message || '账户服务暂时不可用'); }
      if (value.csrfToken) this.csrfToken = value.csrfToken;
      if (action === 'logout' || action === 'password' || action === 'recovery-confirm') this.csrfToken = null;
      return value;
    } catch (error) { if (error instanceof Error && error.name === 'AbortError') throw new Error('连接账户服务超时，请稍后重试'); throw error; }
    finally { window.clearTimeout(timer); }
  }
  consumeRecoveryToken(): string | null {
    const hash = window.location.hash;
    const match = hash.match(/^#reset-password=([^&]+)$/);
    if (!match) return null;
    const token = decodeURIComponent(match[1]);
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    return token;
  }
  notifySessionChanged() { if (this.channel) this.channel.postMessage('changed'); else { try { window.localStorage.setItem('vinyl-session-changed', String(Date.now())); } catch {} } }
  onOtherSessionChanged(callback: () => void) { const handler = () => callback(); const storage = (event: StorageEvent) => { if (event.key === 'vinyl-session-changed') callback(); }; this.channel?.addEventListener('message', handler); window.addEventListener('storage', storage); return () => { this.channel?.removeEventListener('message', handler); window.removeEventListener('storage', storage); }; }
  reload() { window.location.reload(); }
}
export const authService = new WebAuthAdapter();
