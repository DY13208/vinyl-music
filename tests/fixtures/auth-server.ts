import express from 'express';
import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';
import { createClient } from 'redis';
import argon2 from 'argon2';
import { createAuthHandler, type AuthDependencies } from '../../src/server/auth';

const databaseUrl = process.env.DATABASE_URL;
const redisUrl = process.env.REDIS_URL;
const origin = process.env.AUTH_ORIGIN || 'http://127.0.0.1:43180';
if (!databaseUrl || !redisUrl) throw new Error('E2E fixture requires DATABASE_URL and REDIS_URL');
const pool = new Pool({ connectionString: databaseUrl });
const redis = createClient({ url: redisUrl });
let lastRecoveryLink = '';
const deps: AuthDependencies = {
  db: pool,
  sessions: {
    get: async key => String(await redis.get(key) ?? '') || null,
    set: async (key, value, options) => String(await redis.set(key, value, options)),
    del: key => redis.del(key),
    expire: (key, seconds) => redis.expire(key, seconds),
  },
  mailer: { send: async (_email, link) => { lastRecoveryLink = link; } },
};

await redis.connect();
await pool.query(await readFile(new URL('../../migrations/001_auth.sql', import.meta.url), 'utf8'));
await pool.query('delete from password_reset_tokens');
await pool.query('delete from user_credentials');
await pool.query('delete from users');
for (const username of ['user_a', 'user_b']) {
  const email = `${username}@example.test`;
  const created = await pool.query('insert into users(username,email,display_name) values ($1,$2,$3) returning id', [username, email, username]);
  await pool.query('insert into user_credentials(user_id,password_hash) values ($1,$2)', [created.rows[0].id, await argon2.hash('test-password-123', { type: argon2.argon2id })]);
}

const app = express();
app.all('/api/v1/auth/*', createAuthHandler(() => ({ origin, secure: false, databaseUrl, redisUrl }), deps));
app.get('/api/test/recovery-link', (_req, res) => res.json({ link: lastRecoveryLink }));
app.get('/api/health', (_req, res) => res.json({ test: true }));
app.get('/api/artwork', async (_req, res) => res.type('image/svg+xml').send(await readFile(new URL('../../public/assets/cover-placeholder.svg', import.meta.url))));
app.use('/api/collection', (_req, res) => res.status(410).json({ error: 'local only' }));
const server = app.listen(43181, '127.0.0.1');
const close = async () => { await new Promise<void>(resolve => server.close(() => resolve())); await redis.quit(); await pool.end(); };
process.once('SIGTERM', () => void close().finally(() => process.exit(0)));
process.once('SIGINT', () => void close().finally(() => process.exit(0)));
