import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

type AuthRequest = IncomingMessage & { body?: unknown };
type User = { id: string; email: string };
type Session = { access_token: string; refresh_token: string; expires_at: number; recovery?: boolean };
type Config = { url: string; key: string; secret: string; origin: string; origins?: string[]; secure: boolean };
const COOKIE = 'vinyl_session';
class AuthError extends Error { constructor(public status: number, message: string) { super(message); } }

export function authConfig(): Config {
  // Vercel's Supabase integration exposes both SUPABASE_URL and, depending
  // on the framework, NEXT_PUBLIC_SUPABASE_URL. The URL is not a secret.
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  // The current Supabase dashboard calls this the Publishable key. Keep the
  // legacy anon variable as a backwards-compatible fallback.
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '';
  const secret = process.env.AUTH_SESSION_SECRET || '';
  const rawOrigin = process.env.AUTH_ORIGIN || '';
  let origins: string[] = [];
  try { origins = rawOrigin.split(',').map(value => new URL(value.trim()).origin).filter(Boolean); }
  catch { throw new AuthError(503, '账户服务的网站地址配置无效'); }
  const origin = origins[0] || '';
  const secure = process.env.NODE_ENV === 'production' || !!process.env.VERCEL || origin.startsWith('https:');
  if (!/^https:\/\//.test(url) || !key || secret.length < 32 || !origins.length || (secure && origins.some(value => !value.startsWith('https://')))) throw new AuthError(503, '账户服务尚未配置，请联系站点管理员');
  return { url: url.replace(/\/$/, ''), key, secret, origin, origins, secure };
}

export function sealSession(session: Session, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', createHash('sha256').update(secret).digest(), iv);
  return Buffer.concat([iv, cipher.update(JSON.stringify(session)), cipher.final(), cipher.getAuthTag()]).toString('base64url');
}

export function openSession(value: string, secret: string): Session | null {
  try {
    const raw = Buffer.from(value, 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', createHash('sha256').update(secret).digest(), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(-16));
    const session = JSON.parse(Buffer.concat([decipher.update(raw.subarray(12, -16)), decipher.final()]).toString());
    return typeof session.access_token === 'string' && typeof session.refresh_token === 'string' && Number.isFinite(session.expires_at) ? session : null;
  } catch { return null; }
}

async function readBody(req: AuthRequest): Promise<Record<string, unknown>> {
  if (req.body !== undefined) {
    if (Buffer.byteLength(JSON.stringify(req.body)) > 8192 || !req.body || typeof req.body !== 'object' || Array.isArray(req.body)) throw new AuthError(400, '请求格式不正确');
    return req.body as Record<string, unknown>;
  }
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > 8192) throw new AuthError(413, '请求过大');
    chunks.push(Buffer.from(chunk));
  }
  try { const value = JSON.parse(Buffer.concat(chunks).toString() || '{}'); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(); return value; }
  catch { throw new AuthError(400, '请求格式不正确'); }
}

export function createAuthHandler(getConfig = authConfig, request: typeof fetch = fetch) {
  // Provider rate limits remain authoritative across serverless instances.
  const attempts = new Map<string, { count: number; until: number }>();
  return async function authHandler(req: AuthRequest, res: ServerResponse) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (status: number, body: unknown) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }).end(JSON.stringify(body)); };
    try {
      const config = getConfig();
      const action = new URL(req.url || '/', 'https://vinyl.invalid').searchParams.get('action') || 'session';
      const writeCookie = (session: Session | null) => {
        const value = session ? sealSession(session, config.secret) : '';
        if (value.length > 3800) throw new AuthError(502, '账户会话过大，请联系管理员');
        res.setHeader('Set-Cookie', `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${session ? 60 * 60 * 24 * 30 : 0}${config.secure ? '; Secure' : ''}`);
      };
      const call = async (path: string, data?: unknown, token?: string, method = data ? 'POST' : 'GET') => {
        const response = await request(`${config.url}/auth/v1/${path}`, {
          method, signal: AbortSignal.timeout(10000),
          headers: { apikey: config.key, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          ...(data ? { body: JSON.stringify(data) } : {}),
        });
        const value = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (response.status === 429) throw new AuthError(429, '操作过于频繁，请稍后重试');
          if (response.status >= 500) throw new AuthError(502, '账户服务暂时不可用，请稍后重试');
          if (value.code === 'email_not_confirmed') throw new AuthError(401, '请先打开注册邮件，确认邮箱后再登录');
          throw new AuthError(401, '邮箱、密码或验证链接无效，请检查后重试');
        }
        return value;
      };
      const fromCookie = () => openSession(req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1) || '', config.secret);
      const sessionFrom = (value: any, recovery = false): Session => {
        if (!value.access_token || !value.refresh_token) throw new AuthError(401, '登录会话无效，请重新登录');
        return { access_token: value.access_token, refresh_token: value.refresh_token, expires_at: value.expires_at || Math.floor(Date.now() / 1000) + value.expires_in, recovery };
      };
      const validateSession = async () => {
        let session = fromCookie();
        if (!session) throw new AuthError(401, '请先登录');
        if (session.expires_at < Date.now() / 1000 + 60) {
          session = sessionFrom(await call('token?grant_type=refresh_token', { refresh_token: session.refresh_token }), session.recovery);
          writeCookie(session);
        }
        const raw = await call('user', undefined, session.access_token);
        if (!raw.id || !raw.email) throw new AuthError(401, '登录已失效，请重新登录');
        return { session, user: { id: raw.id, email: raw.email } as User };
      };
      if (req.method === 'GET' && action === 'session') {
        if (!fromCookie()) { writeCookie(null); send(200, { user: null }); return; }
        try { const current = await validateSession(); send(200, { user: current.user, recovery: !!current.session.recovery }); }
        catch (error) { if (error instanceof AuthError && error.status === 401) writeCookie(null); throw error; }
        return;
      }
      if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); send(405, { error: '请求方法不支持' }); return; }
      const origin = config.origin || `${config.secure ? 'https' : 'http'}://${req.headers.host}`;
      const allowedOrigins = config.origins?.length ? config.origins : [config.origin];
      if (!allowedOrigins.includes(req.headers.origin || '') || req.headers['sec-fetch-site'] === 'cross-site' || !req.headers['content-type']?.startsWith('application/json')) throw new AuthError(403, '请求来源不受信任，请重新打开本站');
      const body = await readBody(req);
      if (action === 'logout') {
        const session = fromCookie();
        writeCookie(null);
        if (session) await call('logout?scope=local', {}, session.access_token).catch(() => undefined);
        send(200, { user: null }); return;
      }
      const email = String(body.email || '').trim().toLowerCase();
      const password = typeof body.password === 'string' ? body.password : '';
      if (['login', 'register', 'recover'].includes(action)) {
        if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AuthError(400, '请输入有效的邮箱地址');
        const key = createHash('sha256').update(email).digest('hex');
        const now = Date.now();
        for (const [k, entry] of attempts) if (entry.until < now) attempts.delete(k);
        if (attempts.size > 5000) throw new AuthError(429, '操作过于频繁，请稍后重试');
        const entry = attempts.get(key) || { count: 0, until: now + 60000 };
        if (++entry.count > 10) throw new AuthError(429, '操作过于频繁，请稍后重试');
        attempts.set(key, entry);
      }
      if (['register', 'password'].includes(action) && (password.length < 10 || password.length > 128)) throw new AuthError(400, '密码需为 10–128 个字符');
      if (action === 'login') {
        if (!password || password.length > 128) throw new AuthError(400, '请输入密码');
        const value = await call('token?grant_type=password', { email, password });
        writeCookie(sessionFrom(value));
        send(200, { user: { id: value.user.id, email: value.user.email } }); return;
      }
      if (action === 'register') {
        const value = await call('signup', { email, password });
        if (value.access_token) { writeCookie(sessionFrom(value)); send(200, { user: { id: value.user.id, email: value.user.email } }); }
        else send(200, { user: null, message: '如果该邮箱可用于注册，确认邮件已发送，请检查收件箱。' });
        return;
      }
      if (action === 'recover') { await call('recover', { email }); send(200, { message: '如果该邮箱已注册，密码重置邮件已发送，请检查收件箱。' }); return; }
      if (action === 'verify') {
        if (!['signup', 'recovery', 'email'].includes(String(body.type)) || typeof body.tokenHash !== 'string' || body.tokenHash.length > 256) throw new AuthError(400, '验证链接无效');
        const value = await call('verify', { token_hash: body.tokenHash, type: body.type });
        writeCookie(sessionFrom(value, body.type === 'recovery'));
        send(200, { user: { id: value.user.id, email: value.user.email }, recovery: body.type === 'recovery' }); return;
      }
      if (action === 'password') {
        const current = await validateSession();
        // A recovery session or knowledge of the current password is required.
        if (!current.session.recovery) await call('token?grant_type=password', { email: current.user.email, password: String(body.currentPassword || '') });
        await call('user', { password }, current.session.access_token, 'PUT');
        writeCookie({ ...current.session, recovery: false });
        send(200, { user: current.user, message: '密码已更新' }); return;
      }
      send(404, { error: '账户接口不存在' });
    } catch (error) { send(error instanceof AuthError ? error.status : 502, { error: error instanceof AuthError ? error.message : '账户服务暂时不可用，请稍后重试' }); }
  };
}

export const authHandler = createAuthHandler();
