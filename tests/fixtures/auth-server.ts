// Test-only Supabase contract simulator. Never imported by production code.
import express from 'express';
import { readFile } from 'node:fs/promises';
import { createAuthHandler } from '../../src/server/auth';
import retiredCollection from '../../api/collection';

const users = new Map(['a', 'b'].map(letter => [`${letter}@example.test`, { id: `account-${letter}`, email: `${letter}@example.test`, password: 'test-password-123', confirmed: true }]));
const tokens = new Map<string, string>();
const session = (email: string) => {
  const access = `fixture-access-${email}`;
  tokens.set(access, email);
  const user = users.get(email)!;
  return { access_token: access, refresh_token: `fixture-refresh-${email}`, expires_in: 3600, user: { id: user.id, email } };
};
const upstream = (async (url: string, options?: RequestInit) => {
  const data = options?.body ? JSON.parse(String(options.body)) : {};
  if (url.endsWith('/signup')) { users.set(data.email, { id: `account-${users.size}`, ...data, confirmed: false }); return Response.json({}); }
  if (url.endsWith('/recover')) return Response.json({});
  if (url.endsWith('/verify')) {
    const user = users.get(data.token_hash);
    if (!user) return Response.json({}, { status: 401 });
    user.confirmed = true;
    return Response.json(session(user.email));
  }
  if (url.includes('token?grant_type=password')) {
    const user = users.get(data.email);
    if (!user?.confirmed || user.password !== data.password) return Response.json({}, { status: 401 });
    return Response.json(session(user.email));
  }
  const email = tokens.get(new Headers(options?.headers).get('authorization')?.replace('Bearer ', '') || '');
  const user = email && users.get(email);
  if (url.endsWith('/user') && user) {
    if (options?.method === 'PUT') user.password = data.password;
    return Response.json({ id: user.id, email });
  }
  if (url.includes('/logout')) return new Response(null, { status: 204 });
  return Response.json({}, { status: 401 });
}) as typeof fetch;

const app = express();
app.use(express.json());
app.all('/api/auth', createAuthHandler(() => ({ url: 'https://fixture.example.test', key: 'fixture-public-key', secret: 'fixture-only-cookie-key-at-least-thirty-two-characters', origin: 'http://127.0.0.1:43180', secure: false }), upstream));
app.use('/api/collection', retiredCollection);
const cover = await readFile(new URL('../../public/assets/vinyl-textures/black.webp', import.meta.url));
app.get('/api/artwork', (_req, res) => res.type('image/webp').send(cover));
app.get('/api/health', (_req, res) => res.json({ test: true }));
app.listen(43181, '127.0.0.1');
