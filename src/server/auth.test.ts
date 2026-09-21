import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createAuthHandler } from './auth';

const config = { origin: 'http://app.example.test', secure: false, databaseUrl: 'postgres://test', redisUrl: 'redis://test' };

test('new auth routes reject a request with a foreign origin before storage access', async () => {
  let touched = false;
  const deps = {
    db: { query: async () => { touched = true; return { rows: [], rowCount: 0 }; } },
    sessions: { get: async () => null, set: async () => undefined, del: async () => undefined, expire: async () => undefined },
    mailer: { send: async () => undefined },
  };
  const server = createServer(createAuthHandler(() => config, deps));
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const port = (server.address() as { port: number }).port;
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/auth/login`, { method: 'POST', headers: { Origin: 'https://evil.test', 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'alice', password: 'bad' }) });
    assert.equal(response.status, 403);
    assert.equal(touched, false);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});
