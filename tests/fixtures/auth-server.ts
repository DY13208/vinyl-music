import express from 'express';
import { readFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { createAuthHandler } from '../../src/server/auth';
const users = new Map<string, any>();
const credentials = new Map<string, string>();
const resets = new Map<string, any>();
const sessions = new Map<string, string>();
let lastRecoveryLink = '';
for (const username of ['a', 'b']) { const row = { id: `account-${username}`, username, email: `${username}@example.test`, display_name: username, session_version: 0 }; users.set(username, row); credentials.set(row.id, 'test-password-123'); }
const db = { query: async (sql: string, values: any[] = []) => {
  const lower = sql.toLowerCase();
  if (lower === 'begin' || lower === 'commit' || lower === 'rollback') return { rows: [], rowCount: 0 };
  if (lower.startsWith('insert into users')) { const row = { id: randomUUID(), username: values[0], email: values[1], display_name: values[2], session_version: 0 }; users.set(row.username, row); return { rows: [row], rowCount: 1 }; }
  if (lower.startsWith('insert into user_credentials')) { credentials.set(values[0], values[1]); return { rows: [], rowCount: 1 }; }
  if (lower.includes('from users where username')) { const row = users.get(values[0]); return { rows: row ? [row] : [], rowCount: row ? 1 : 0 }; }
  if (lower.includes('from users where email')) { const row = [...users.values()].find(item => item.email === values[0]); return { rows: row ? [row] : [], rowCount: row ? 1 : 0 }; }
  if (lower.includes('join user_credentials')) { const row = users.get(values[0]); return { rows: row ? [{ ...row, password_hash: credentials.get(row.id) }] : [], rowCount: row ? 1 : 0 }; }
  if (lower.startsWith('select password_hash')) { return { rows: [{ password_hash: credentials.get(values[0]) }], rowCount: 1 }; }
  if (lower.startsWith('select id, username')) { const row = users.get(values[0]); return { rows: row ? [row] : [], rowCount: row ? 1 : 0 }; }
  if (lower.startsWith('insert into password_reset_tokens')) { resets.set(values[0], { id: randomUUID(), user_id: values[0], token_hash: values[1], expires_at: Date.now() + 900000, used_at: null }); return { rows: [], rowCount: 1 }; }
  if (lower.startsWith('select t.id')) { const row = [...resets.values()].find(item => item.token_hash === values[0] && !item.used_at && item.expires_at > Date.now()); return { rows: row ? [{ ...row, session_version: users.get(row.user_id)?.session_version }] : [], rowCount: row ? 1 : 0 }; }
  if (lower.startsWith('update password_reset_tokens set used_at')) { const row = [...resets.values()].find(item => item.id === values[0] || item.user_id === values[0]); if (row) row.used_at = Date.now(); return { rows: row && lower.includes('returning') ? [row] : [], rowCount: row ? 1 : 0 }; }
  if (lower.startsWith('update user_credentials')) { credentials.set(values[1], values[0]); return { rows: [], rowCount: 1 }; }
  if (lower.startsWith('update users set session_version')) { const row = users.get(values[0]); if (row) row.session_version += 1; return { rows: [], rowCount: row ? 1 : 0 }; }
  return { rows: [], rowCount: 0 };
} };
const store = { get: async (key: string) => sessions.get(key) || null, set: async (key: string, value: string) => { sessions.set(key, value); return 'OK'; }, del: async (key: string) => { sessions.delete(key); return 1; }, expire: async () => 1 };
const app = express(); app.all('/api/v1/auth/*', createAuthHandler(() => ({ origin: 'http://127.0.0.1:43180', secure: false, databaseUrl: 'fixture', redisUrl: 'fixture' }), { db, sessions: store, mailer: { send: async (_email, link) => { lastRecoveryLink = link; } }, hash: async value => value, verify: async (hash, value) => hash === value }));
app.get('/api/test/recovery-link', (_req, res) => res.json({ link: lastRecoveryLink }));
app.get('/api/health', (_req, res) => res.json({ test: true }));
const cover = await readFile(new URL('../../public/assets/cover-placeholder.svg', import.meta.url));
app.get('/api/artwork', (_req, res) => res.type('image/webp').send(cover));
app.use('/api/collection', (_req, res) => res.status(410).json({ error: 'local only' }));
app.listen(43181, '127.0.0.1');
