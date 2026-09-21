import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createAuthHandler } from '../../src/server/auth';
const user = { id: 'u1', username: 'alice', email: 'alice@example.test', display_name: 'Alice', session_version: 0 };
const sessions = new Map<string, string>();
const db = { query: async (sql: string, values: any[] = []) => {
  const q = sql.toLowerCase();
  if (q.startsWith('select u.id,u.username')) return { rows: [{ ...user, password_hash: 'correct-password' }], rowCount: 1 };
  if (q.startsWith('select id, username')) return { rows: [user], rowCount: 1 };
  if (q.startsWith('select password_hash')) return { rows: [{ password_hash: 'correct-password' }], rowCount: 1 };
  if (q === 'begin' || q === 'commit' || q === 'rollback') return { rows: [], rowCount: 0 };
  return { rows: [], rowCount: 0 };
} };
const deps = { db, sessions: { get: async (key: string) => sessions.get(key) || null, set: async (key: string, value: string) => { sessions.set(key, value); return 'OK'; }, del: async (key: string) => { sessions.delete(key); return 1; }, expire: async () => 1 }, mailer: { send: async () => undefined }, hash: async (value: string) => value, verify: async (hash: string, value: string) => hash === value };
const config = { origin: 'http://app.example.test', secure: false, databaseUrl: 'fixture', redisUrl: 'fixture' };
async function start() { const server = createServer(createAuthHandler(() => config, deps)); await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve)); return server; }

test('auth HTTP login, session restore and logout use opaque cookie and CSRF', async () => {
  const server = await start(); const port = (server.address() as { port: number }).port; const base = `http://127.0.0.1:${port}/api/v1/auth`;
  try {
    const denied = await fetch(`${base}/login`, { method: 'POST', headers: { Origin: 'https://evil.test', 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'alice', password: 'correct-password' }) });
    assert.equal(denied.status, 403);
    const login = await fetch(`${base}/login`, { method: 'POST', headers: { Origin: config.origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'alice', password: 'correct-password' }) });
    assert.equal(login.status, 200); const payload = await login.json(); const setCookie = login.headers.get('set-cookie')!; const cookie = setCookie.split(';')[0]; assert.equal(setCookie.includes('correct-password'), false); assert.ok(payload.csrfToken);
    const session = await fetch(`${base}/session`, { headers: { Cookie: cookie } }); assert.equal(session.status, 200);
    const logout = await fetch(`${base}/logout`, { method: 'POST', headers: { Origin: config.origin, Cookie: cookie, 'X-CSRF-Token': payload.csrfToken } }); assert.equal(logout.status, 204);
    const after = await fetch(`${base}/session`, { headers: { Cookie: cookie } }); assert.equal(after.status, 401);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});
