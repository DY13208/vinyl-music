export type AuthUser = { id: string; email: string };
export type AuthResult = { user?: AuthUser | null; recovery?: boolean; message?: string };

export class WebAuthAdapter {
  private channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('vinyl-account-session');

  async request(action: string, body?: Record<string, unknown>): Promise<AuthResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(`/api/auth?action=${action}`, {
        method: body ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store', signal: controller.signal,
        ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
      });
      const value = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(value.error || '账户服务暂时不可用');
      return value;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw new Error('连接账户服务超时，请稍后重试');
      throw error;
    } finally { clearTimeout(timer); }
  }

  consumeEmailLink(): { tokenHash: string; type: string } | null {
    const url = new URL(window.location.href);
    const tokenHash = url.searchParams.get('token_hash');
    const type = url.searchParams.get('type');
    if (!tokenHash || !type) return null;
    url.searchParams.delete('token_hash'); url.searchParams.delete('type'); url.searchParams.delete('auth');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    return { tokenHash, type };
  }

  notifySessionChanged() {
    if (this.channel) this.channel.postMessage('changed');
    else { try { window.localStorage.setItem('vinyl-session-changed', String(Date.now())); } catch { /* Cookie still expires normally. */ } }
  }
  onOtherSessionChanged(callback: () => void) {
    const handler = () => callback();
    const storage = (event: StorageEvent) => { if (event.key === 'vinyl-session-changed') callback(); };
    const pageshow = (event: PageTransitionEvent) => { if (event.persisted) callback(); };
    this.channel?.addEventListener('message', handler);
    window.addEventListener('storage', storage);
    window.addEventListener('pageshow', pageshow);
    return () => { this.channel?.removeEventListener('message', handler); window.removeEventListener('storage', storage); window.removeEventListener('pageshow', pageshow); };
  }
  reload() { window.location.reload(); }
}

export const authService = new WebAuthAdapter();
