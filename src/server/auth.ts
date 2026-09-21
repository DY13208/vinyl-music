import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Pool, type PoolClient } from 'pg';
import { createClient, type RedisClientType } from 'redis';
import argon2 from 'argon2';
import nodemailer from 'nodemailer';

type AuthRequest = IncomingMessage & { body?: unknown };
type User = { id: string; username: string; displayName: string };
type Session = { userId: string; csrfToken: string; sessionVersion: number; absoluteExpiresAt: number };
export type AuthConfig = { databaseUrl?: string; redisUrl?: string; origin: string; secure: boolean; smtp?: { host: string; port: number; secure: boolean; user?: string; password?: string; from: string } };
export type AuthErrorCode = 'INVALID_INPUT'|'INVALID_CREDENTIALS'|'SESSION_REQUIRED'|'ORIGIN_NOT_ALLOWED'|'CSRF_INVALID'|'USERNAME_TAKEN'|'EMAIL_TAKEN'|'INVALID_RESET_TOKEN'|'SERVICE_UNAVAILABLE';
class AuthError extends Error { constructor(public status: number, public code: AuthErrorCode, message: string) { super(message); } }

type UserRow = { id: string; username: string; email: string; display_name: string; session_version: number };
type Db = { query: (text: string, values?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }>; connect?: () => Promise<PoolClient> };
type Store = { get: (key: string) => Promise<string | null>; set: (key: string, value: string, options?: { EX?: number }) => Promise<unknown>; del: (key: string) => Promise<unknown>; expire: (key: string, seconds: number) => Promise<unknown> };
type Mailer = { send: (email: string, link: string) => Promise<void> };
export type AuthDependencies = { db: Db; sessions: Store; mailer: Mailer; now?: () => number; hash?: (password: string) => Promise<string>; verify?: (hash: string, password: string) => Promise<boolean> };

const COOKIE = 'vinyl_session';
const SESSION_IDLE = 24 * 60 * 60;
const SESSION_ABSOLUTE = 7 * 24 * 60 * 60;
const RESET_TTL = 15 * 60;
const normalize = (value: unknown) => String(value ?? '').trim().toLowerCase();
const userDto = (row: UserRow): User => ({ id: row.id, username: row.username, displayName: row.display_name });
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

export function authConfig(env = process.env): AuthConfig {
  const origin = env.AUTH_ORIGIN || '';
  let parsed: URL;
  try { parsed = new URL(origin); } catch { throw new AuthError(503, 'SERVICE_UNAVAILABLE', '账户服务尚未配置，请联系站点管理员'); }
  const secure = env.NODE_ENV === 'production' || env.VERCEL === '1' || parsed.protocol === 'https:';
  if (!env.DATABASE_URL || !env.REDIS_URL || !origin || (secure && parsed.protocol !== 'https:')) throw new AuthError(503, 'SERVICE_UNAVAILABLE', '账户服务尚未配置，请联系站点管理员');
  const smtpHost = env.SMTP_HOST;
  const smtp = smtpHost ? { host: smtpHost, port: Number(env.SMTP_PORT || 587), secure: env.SMTP_SECURE === 'true', user: env.SMTP_USER, password: env.SMTP_PASSWORD, from: env.SMTP_FROM || env.SMTP_USER || '' } : undefined;
  return { databaseUrl: env.DATABASE_URL, redisUrl: env.REDIS_URL, origin: parsed.origin, secure, smtp };
}

export function createAuthDependencies(config: AuthConfig): AuthDependencies {
  if (!config.databaseUrl || !config.redisUrl) throw new AuthError(503, 'SERVICE_UNAVAILABLE', '账户服务尚未配置，请联系站点管理员');
  const pool = new Pool({ connectionString: config.databaseUrl });
  const redis = createClient({ url: config.redisUrl }) as RedisClientType;
  let connected: Promise<void> | undefined;
  const ensureRedis = async () => { if (!connected) connected = redis.connect().then(() => undefined); await connected; };
  const sessions: Store = { get: async key => { await ensureRedis(); return String(await redis.get(key) ?? '') || null; }, set: async (key, value, options) => { await ensureRedis(); return redis.set(key, value, options); }, del: async key => { await ensureRedis(); return redis.del(key); }, expire: async (key, seconds) => { await ensureRedis(); return redis.expire(key, seconds); } };
  const mailer: Mailer = { send: async (email, link) => { if (!config.smtp) throw new AuthError(503, 'SERVICE_UNAVAILABLE', '邮件服务尚未配置'); const transport = nodemailer.createTransport({ host: config.smtp.host, port: config.smtp.port, secure: config.smtp.secure, auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.password } : undefined, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 10000 }); await transport.sendMail({ from: config.smtp.from, to: email, subject: '重置 Vinyl Shelf 密码', text: `请打开链接设置新密码：${link}` }); } };
  return { db: pool, sessions, mailer };
}

async function body(req: AuthRequest): Promise<Record<string, unknown>> {
  if (req.body !== undefined) { if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) throw new AuthError(400, 'INVALID_INPUT', '请求格式不正确'); return req.body as Record<string, unknown>; }
  const chunks: Buffer[] = []; let length = 0;
  for await (const chunk of req) { length += Buffer.byteLength(chunk); if (length > 16384) throw new AuthError(400, 'INVALID_INPUT', '请求格式不正确'); chunks.push(Buffer.from(chunk)); }
  try { const parsed = JSON.parse(Buffer.concat(chunks).toString() || '{}'); if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(); return parsed; } catch { throw new AuthError(400, 'INVALID_INPUT', '请求格式不正确'); }
}
function cookie(req: AuthRequest) { return req.headers.cookie?.split(';').map(x => x.trim()).find(x => x.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1) || ''; }
function setCookie(res: ServerResponse, value: string, config: AuthConfig, maxAge: number) { res.setHeader('Set-Cookie', `${config.secure ? '__Host-' : ''}${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${config.secure ? '; Secure' : ''}`); }
function validString(value: unknown, min: number, max: number) { return typeof value === 'string' && value.length >= min && value.length <= max; }
function validPassword(value: unknown) { return validString(value, 12, 128); }
function originAllowed(req: AuthRequest, config: AuthConfig) { return req.headers.origin === config.origin && req.headers['sec-fetch-site'] !== 'cross-site'; }

export function createAuthHandler(getConfig = () => authConfig(), injected?: AuthDependencies) {
  return async function authHandler(req: AuthRequest, res: ServerResponse) {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (status: number, value?: unknown) => { if (status === 204) { res.writeHead(status).end(); return; } res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }).end(JSON.stringify(value)); };
    let config: AuthConfig; let deps: AuthDependencies;
    try { config = getConfig(); deps = injected || createAuthDependencies(config); } catch (error) { const e = error instanceof AuthError ? error : new AuthError(503, 'SERVICE_UNAVAILABLE', '账户服务尚未配置，请联系站点管理员'); send(e.status, { error: { code: e.code, message: e.message } }); return; }
    const now = deps.now || (() => Date.now()); const hash = deps.hash || ((password: string) => argon2.hash(password, { type: argon2.argon2id })); const verify = deps.verify || ((encoded: string, password: string) => argon2.verify(encoded, password));
    let sid = '';
    try {
      const path = new URL(req.url || '/', 'http://vinyl.invalid').pathname.replace(/^\/api\/v1\/auth/, '').replace(/\/$/, '') || '/session';
      const csrfRequired = path === '/logout' || path === '/password';
      if (req.method !== 'GET' && !originAllowed(req, config)) throw new AuthError(403, 'ORIGIN_NOT_ALLOWED', '请求来源不受信任，请重新打开本站');
      sid = cookie(req); const sessionKey = sid ? `auth:session:${sha256(sid)}` : '';
      const loadSession = async () => { if (!sid) throw new AuthError(401, 'SESSION_REQUIRED', '请先登录'); const raw = await deps.sessions.get(sessionKey); if (!raw) throw new AuthError(401, 'SESSION_REQUIRED', '请先登录'); const value = JSON.parse(raw) as Session; if (value.absoluteExpiresAt <= now()) { await deps.sessions.del(sessionKey); throw new AuthError(401, 'SESSION_REQUIRED', '请先登录'); } const user = await deps.db.query('select id, username, email, display_name, session_version from users where id=$1 and status=\'active\'', [value.userId]); if (!user.rows[0] || Number(user.rows[0].session_version) !== value.sessionVersion) throw new AuthError(401, 'SESSION_REQUIRED', '请先登录'); const ttl = Math.min(SESSION_IDLE, Math.max(1, Math.floor((value.absoluteExpiresAt - now()) / 1000))); await deps.sessions.expire(sessionKey, ttl); return { value, row: user.rows[0] as UserRow }; };
      const clear = async () => { if (sid) await deps.sessions.del(sessionKey); setCookie(res, '', config, 0); };
      if (req.method === 'GET' && path === '/session') { try { const current = await loadSession(); send(200, { user: userDto(current.row), csrfToken: current.value.csrfToken, expiresAt: new Date(current.value.absoluteExpiresAt).toISOString() }); } catch (error) { if (error instanceof AuthError && error.status === 401) setCookie(res, '', config, 0); throw error; } return; }
      if (req.method !== 'POST' && req.method !== 'PUT') { res.setHeader('Allow', 'GET, POST, PUT'); send(405, { error: { code: 'INVALID_INPUT', message: '请求方法不支持' } }); return; }
      if (csrfRequired) { const current = await loadSession(); if (req.headers['x-csrf-token'] !== current.value.csrfToken) throw new AuthError(403, 'CSRF_INVALID', '请求校验失败'); }
      const input = await body(req);
      if (path === '/register' && req.method === 'POST') {
        const username = normalize(input.username); const email = normalize(input.email); const displayName = String(input.displayName ?? '').trim(); const password = input.password;
        if (!/^[a-z0-9_]{3,32}$/.test(username) || !/^\S+@\S+\.\S+$/.test(email) || displayName.length < 2 || displayName.length > 40 || !validPassword(password)) throw new AuthError(400, 'INVALID_INPUT', '注册信息不符合要求');
        const passwordHash = await hash(password as string); const client = deps.db.connect ? await deps.db.connect() : null;
        try { await (client || deps.db).query('begin'); const result = await (client || deps.db).query('insert into users(username,email,display_name) values ($1,$2,$3) returning id,username,email,display_name,session_version', [username,email,displayName]); await (client || deps.db).query('insert into user_credentials(user_id,password_hash) values ($1,$2)', [result.rows[0].id,passwordHash]); await (client || deps.db).query('commit'); send(201, { user: userDto(result.rows[0]) }); } catch (error) { await (client || deps.db).query('rollback').catch(() => undefined); const message = String(error).includes('users_username_uq') || String(error).includes('username') ? '用户名已被使用' : '邮箱已被使用'; throw new AuthError(409, message.includes('用户名') ? 'USERNAME_TAKEN' : 'EMAIL_TAKEN', message); } finally { client?.release(); } return;
      }
      if (path === '/login' && req.method === 'POST') { const username = normalize(input.username); const password = input.password; if (!username || !validString(password, 1, 128)) throw new AuthError(400, 'INVALID_INPUT', '请输入用户名和密码'); const result = await deps.db.query('select u.id,u.username,u.email,u.display_name,u.session_version,c.password_hash from users u join user_credentials c on c.user_id=u.id where u.username=$1 and u.status=\'active\'', [username]); if (!result.rows[0] || !(await verify(result.rows[0].password_hash, password as string))) throw new AuthError(401, 'INVALID_CREDENTIALS', '用户名或密码无效'); const rawSid = randomBytes(32).toString('base64url'); const session: Session = { userId: result.rows[0].id, csrfToken: randomBytes(32).toString('base64url'), sessionVersion: Number(result.rows[0].session_version), absoluteExpiresAt: now() + SESSION_ABSOLUTE * 1000 }; await deps.sessions.set(`auth:session:${sha256(rawSid)}`, JSON.stringify(session), { EX: SESSION_IDLE }); setCookie(res, rawSid, config, SESSION_ABSOLUTE); send(200, { user: userDto(result.rows[0]), csrfToken: session.csrfToken, expiresAt: new Date(session.absoluteExpiresAt).toISOString() }); return; }
      if (path === '/logout' && req.method === 'POST') { await clear(); send(204); return; }
      if (path === '/password' && req.method === 'PUT') { const current = await loadSession(); const currentPassword = input.currentPassword; const newPassword = input.newPassword; if (!validString(currentPassword,1,128) || !validPassword(newPassword)) throw new AuthError(400, 'INVALID_INPUT', '密码格式不正确'); const credentials = await deps.db.query('select password_hash from user_credentials where user_id=$1', [current.row.id]); if (!credentials.rows[0] || !(await verify(credentials.rows[0].password_hash, currentPassword as string))) throw new AuthError(401, 'INVALID_CREDENTIALS', '当前密码不正确'); const passwordHash = await hash(newPassword as string); const client = deps.db.connect ? await deps.db.connect() : null; try { await (client || deps.db).query('begin'); await (client || deps.db).query('update user_credentials set password_hash=$1,updated_at=now() where user_id=$2', [passwordHash,current.row.id]); await (client || deps.db).query('update users set session_version=session_version+1,updated_at=now() where id=$1', [current.row.id]); await (client || deps.db).query('update password_reset_tokens set used_at=now() where user_id=$1 and used_at is null', [current.row.id]); await (client || deps.db).query('commit'); } catch (error) { await (client || deps.db).query('rollback').catch(() => undefined); throw error; } finally { client?.release(); } await clear(); send(204); return; }
      if (path === '/password/recovery/request' && req.method === 'POST') { const email = normalize(input.email); if (!/^\S+@\S+\.\S+$/.test(email)) throw new AuthError(400, 'INVALID_INPUT', '请输入有效的邮箱地址'); const result = await deps.db.query('select id,email from users where email=$1 and status=\'active\'', [email]); if (!result.rows[0]) { send(202, { message: '如果该邮箱已注册，将收到重置邮件' }); return; } const token = randomBytes(32).toString('base64url'); const tokenHash = sha256(token); await deps.db.query('insert into password_reset_tokens(user_id,token_hash,expires_at,used_at) values ($1,$2,now()+interval \'15 minutes\',null) on conflict (user_id) do update set token_hash=excluded.token_hash,expires_at=excluded.expires_at,used_at=null,created_at=now()', [result.rows[0].id,tokenHash]); const link = `${config.origin}/#reset-password=${encodeURIComponent(token)}`; try { await deps.mailer.send(email, link); } catch (error) { if (error instanceof AuthError) throw error; console.error('password recovery mail failed'); } send(202, { message: '如果该邮箱已注册，将收到重置邮件' }); return; }
      if (path === '/password/recovery/confirm' && req.method === 'POST') { const token = input.token; const newPassword = input.newPassword; if (!validString(token, 20, 256) || !validPassword(newPassword)) throw new AuthError(400, 'INVALID_RESET_TOKEN', '链接已失效，请重新申请'); const tokenHash = sha256(token as string); const found = await deps.db.query('select t.id,t.user_id,u.session_version from password_reset_tokens t join users u on u.id=t.user_id where t.token_hash=$1 and t.used_at is null and t.expires_at>now()', [tokenHash]); if (!found.rows[0]) throw new AuthError(400, 'INVALID_RESET_TOKEN', '链接已失效，请重新申请'); const passwordHash = await hash(newPassword as string); const client = deps.db.connect ? await deps.db.connect() : null; try { await (client || deps.db).query('begin'); const consumed = await (client || deps.db).query('update password_reset_tokens set used_at=now() where id=$1 and used_at is null and expires_at>now() returning id,user_id', [found.rows[0].id]); if (!consumed.rowCount) throw new AuthError(400, 'INVALID_RESET_TOKEN', '链接已失效，请重新申请'); await (client || deps.db).query('update user_credentials set password_hash=$1,updated_at=now() where user_id=$2', [passwordHash,found.rows[0].user_id]); await (client || deps.db).query('update users set session_version=session_version+1,updated_at=now() where id=$1', [found.rows[0].user_id]); await (client || deps.db).query('commit'); } catch (error) { await (client || deps.db).query('rollback').catch(() => undefined); throw error; } finally { client?.release(); } await clear(); send(204); return; }
      throw new AuthError(404, 'INVALID_INPUT', '账户接口不存在');
    } catch (error) { const e = error instanceof AuthError ? error : new AuthError(503, 'SERVICE_UNAVAILABLE', '账户服务暂时不可用，请稍后重试'); if (e.status === 401 && sid) setCookie(res, '', config, 0); send(e.status, { error: { code: e.code, message: e.message } }); }
  };
}
export const authHandler = createAuthHandler();
