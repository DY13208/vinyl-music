import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createAuthHandler, openSession, sealSession } from './auth';

const config = { url: 'https://auth.example.test', key: 'test-public-key', secret: 'unit-test-only-secret-with-at-least-32-characters', origin: 'http://app.example.test', secure: false };
const tokens = { access_token: 'unit-access-token', refresh_token: 'unit-refresh-token', expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: 'account-a', email: 'a@example.test' } };

test('authenticated cookies are encrypted and reject tampering', () => {
  const value = sealSession(tokens, config.secret);
  assert.equal(value.includes(tokens.access_token), false);
  assert.equal(openSession(value, config.secret)?.refresh_token, tokens.refresh_token);
  assert.equal(openSession(value, 'wrong-secret'), null);
  assert.equal(openSession(value.slice(0, 20) + 'x' + value.slice(21), config.secret), null);
});

test('real HTTP auth routes enforce origin, cookie session, password rules and logout', async () => {
  const upstreamCalls: string[] = [];
  const upstream = (async (url: string, options?: RequestInit) => {
    upstreamCalls.push(url);
    if (url.endsWith('/user')) return Response.json(tokens.user);
    if (url.includes('token?grant_type=password')) {
      const body = JSON.parse(String(options?.body));
      return body.password === 'valid-test-password' ? Response.json(tokens) : Response.json({ code: 'invalid_credentials' }, { status: 400 });
    }
    if (url.includes('logout')) return new Response(null, { status: 204 });
    return Response.json({});
  }) as typeof fetch;
  const server = createServer(createAuthHandler(() => config, upstream));
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number };
  const base = `http://127.0.0.1:${address.port}/api/auth`;
  const post = (action: string, body: unknown, origin = config.origin, cookie = '') => fetch(`${base}?action=${action}`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify(body) });
  try {
    assert.equal((await (await fetch(base)).json()).user, null);
    assert.equal((await post('login', { email: 'a@example.test', password: 'valid-test-password' }, 'https://evil.test')).status, 403);
    assert.equal(upstreamCalls.length, 0);
    assert.equal((await post('register', { email: 'a@example.test', password: 'short' })).status, 400);
    assert.equal((await post('login', { email: 'a@example.test', password: 'wrong' })).status, 401);
    const login = await post('login', { email: 'a@example.test', password: 'valid-test-password' });
    const cookie = login.headers.get('set-cookie')!;
    assert.match(cookie, /HttpOnly/); assert.match(cookie, /SameSite=Lax/);
    assert.equal(cookie.includes(tokens.access_token), false);
    assert.deepEqual(await login.json(), { user: tokens.user });
    const session = await fetch(base, { headers: { Cookie: cookie.split(';')[0] } });
    assert.deepEqual((await session.json()).user, tokens.user);
    const logout = await post('logout', {}, config.origin, cookie.split(';')[0]);
    assert.match(logout.headers.get('set-cookie')!, /Max-Age=0/);
    assert.equal(logout.headers.get('cache-control'), 'no-store');
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('expired sessions refresh through the backend and expose only account identity', async () => {
  const expired = sealSession({ ...tokens, expires_at: 1 }, config.secret);
  const server = createServer(createAuthHandler(() => config, (async (url: string) => Response.json(url.includes('refresh_token') ? tokens : tokens.user)) as typeof fetch));
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${(server.address() as { port: number }).port}/api/auth`, { headers: { Cookie: `vinyl_session=${expired}` } });
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('set-cookie'));
    assert.deepEqual(await response.json(), { user: tokens.user, recovery: false });
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});
