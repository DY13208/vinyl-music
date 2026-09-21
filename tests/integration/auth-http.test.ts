import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { Pool } from 'pg';
import { createClient } from 'redis';
import { createAuthHandler, type AuthDependencies } from '../../src/server/auth';

const databaseUrl = process.env.DATABASE_URL;
const redisUrl = process.env.REDIS_URL;
if (!databaseUrl || !redisUrl) throw new Error('DATABASE_URL and REDIS_URL are required for test:auth');
const origin = process.env.AUTH_ORIGIN || 'http://127.0.0.1:43280';
const pool = new Pool({ connectionString: databaseUrl });
const redis = createClient({ url: redisUrl });
let lastRecoveryLink = '';
let authClock: number | undefined;
const deps: AuthDependencies = {
  db: pool,
  sessions: {
    get: async key => String(await redis.get(key) ?? '') || null,
    set: async (key, value, options) => String(await redis.set(key, value, options)),
    del: key => redis.del(key),
    expire: (key, seconds) => redis.expire(key, seconds),
  },
  mailer: { send: async (_email, link) => { lastRecoveryLink = link; } },
  now: () => authClock ?? Date.now(),
};
const config = { origin, secure: false, databaseUrl, redisUrl };
const jsonHeaders = { Origin: origin, 'Content-Type': 'application/json' };
const cookieValue = (response: Response) => response.headers.get('set-cookie')?.split(';')[0] || '';

async function start() {
  await redis.connect();
  await pool.query('delete from password_reset_tokens');
  await pool.query('delete from user_credentials');
  await pool.query('delete from users');
  const server = createServer(createAuthHandler(() => config, deps));
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  return server;
}

test('all auth HTTP flows run against isolated PostgreSQL 18 and Redis 7', async () => {
  const server = await start();
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/v1/auth`;
  const suffix = Date.now().toString(36);
  const username = `integration_${suffix}`;
  const email = `${username}@example.test`;
  const password = 'initial-password-123';
  try {
    assert.equal((await fetch(`${base}/session`)).status, 401);
    const register = await fetch(`${base}/register`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ username, email, displayName: 'Integration User', password }) });
    assert.equal(register.status, 201);
    const duplicate = await fetch(`${base}/register`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ username, email: `other-${email}`, displayName: 'Integration User', password }) });
    assert.equal(duplicate.status, 409);
    const wrongLogin = await fetch(`${base}/login`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ username, password: 'wrong-password-123' }) });
    assert.equal(wrongLogin.status, 401);
    const login = await fetch(`${base}/login`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ username, password }) });
    assert.equal(login.status, 200);
    const loginBody = await login.json(); const firstCookie = cookieValue(login); assert.ok(firstCookie); assert.ok(loginBody.csrfToken); assert.equal(firstCookie.includes(password), false);
    const firstKey = `auth:session:${createHash('sha256').update(firstCookie.split('=')[1]).digest('hex')}`;
    assert.ok((await redis.ttl(firstKey)) <= 24 * 60 * 60);
    assert.equal((await fetch(`${base}/session`, { headers: { Cookie: firstCookie } })).status, 200);
    const secondLogin = await fetch(`${base}/login`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ username, password }) });
    const secondBody = await secondLogin.json(); const secondCookie = cookieValue(secondLogin);
    const logout = await fetch(`${base}/logout`, { method: 'POST', headers: { ...jsonHeaders, Cookie: firstCookie, 'X-CSRF-Token': loginBody.csrfToken } });
    assert.equal(logout.status, 204);
    assert.equal((await fetch(`${base}/session`, { headers: { Cookie: firstCookie } })).status, 401);
    assert.equal((await fetch(`${base}/session`, { headers: { Cookie: secondCookie } })).status, 200);
    const badCsrf = await fetch(`${base}/password`, { method: 'PUT', headers: { ...jsonHeaders, Cookie: secondCookie, 'X-CSRF-Token': 'wrong' }, body: JSON.stringify({ currentPassword: password, newPassword: 'changed-password-123' }) });
    assert.equal(badCsrf.status, 403);
    const change = await fetch(`${base}/password`, { method: 'PUT', headers: { ...jsonHeaders, Cookie: secondCookie, 'X-CSRF-Token': secondBody.csrfToken }, body: JSON.stringify({ currentPassword: password, newPassword: 'changed-password-123' }) });
    assert.equal(change.status, 204);
    assert.equal((await fetch(`${base}/session`, { headers: { Cookie: secondCookie } })).status, 401);
    const changedLogin = await fetch(`${base}/login`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ username, password: 'changed-password-123' }) });
    assert.equal(changedLogin.status, 200);
    const changedCookie = cookieValue(changedLogin);
    const recoveryRequest = await fetch(`${base}/password/recovery/request`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ email }) });
    assert.equal(recoveryRequest.status, 202); const recoveryMessage = await recoveryRequest.text();
    const unknownRecovery = await fetch(`${base}/password/recovery/request`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ email: 'missing@example.test' }) });
    assert.equal(unknownRecovery.status, 202); assert.equal(await unknownRecovery.text(), recoveryMessage); assert.match(lastRecoveryLink, /#reset-password=/);
    const token = lastRecoveryLink.split('#reset-password=')[1];
    const confirm = await fetch(`${base}/password/recovery/confirm`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ token, newPassword: 'recovered-password-123' }) });
    assert.equal(confirm.status, 204);
    assert.equal((await fetch(`${base}/session`, { headers: { Cookie: changedCookie } })).status, 401);
    const replay = await fetch(`${base}/password/recovery/confirm`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ token, newPassword: 'replayed-password-123' }) });
    assert.equal(replay.status, 400);
    authClock = Date.now();
    const absoluteLogin = await fetch(`${base}/login`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ username, password: 'recovered-password-123' }) });
    assert.equal(absoluteLogin.status, 200); const absoluteCookie = cookieValue(absoluteLogin);
    authClock += 7 * 24 * 60 * 60 * 1000 + 1000;
    assert.equal((await fetch(`${base}/session`, { headers: { Cookie: absoluteCookie } })).status, 401);
    authClock = undefined;
    const idleLogin = await fetch(`${base}/login`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ username, password: 'recovered-password-123' }) });
    const idleCookie = cookieValue(idleLogin); const idleKey = `auth:session:${createHash('sha256').update(idleCookie.split('=')[1]).digest('hex')}`;
    await redis.expire(idleKey, 1); await new Promise(resolve => setTimeout(resolve, 1100));
    assert.equal((await fetch(`${base}/session`, { headers: { Cookie: idleCookie } })).status, 401);
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
    await redis.flushDb(); await redis.quit(); await pool.end();
  }
});
