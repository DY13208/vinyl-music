import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { Pool } from 'pg';
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required for test:db');
const pool = new Pool({ connectionString: databaseUrl });
const unique = `db_${Date.now().toString(36)}`;
let userId = '';

test('auth schema enforces uniqueness, rollback and one-time token storage', async () => {
  const client = await pool.connect();
  try {
    const created = await client.query('insert into users(username,email,display_name) values ($1,$2,$3) returning id', [unique, `${unique}@example.test`, 'DB User']);
    userId = created.rows[0].id;
    await client.query('insert into user_credentials(user_id,password_hash) values ($1,$2)', [userId, '$argon2id$v=19$m=65536,t=3,p=1$test']);
    await assert.rejects(() => client.query('insert into users(username,email,display_name) values ($1,$2,$3)', [unique, `other-${unique}@example.test`, 'Duplicate']), /duplicate key/);
    await assert.rejects(() => client.query('insert into users(username,email,display_name) values ($1,$2,$3)', [`other_${unique}`, `${unique}@example.test`, 'Duplicate']), /duplicate key/);
    const rawToken = randomUUID(); const digest = createHash('sha256').update(rawToken).digest('hex');
    await client.query('insert into password_reset_tokens(user_id,token_hash,expires_at) values ($1,$2,now()+interval \'15 minutes\')', [userId, digest]);
    const stored = await client.query('select token_hash, used_at, expires_at > now() as valid from password_reset_tokens where user_id=$1', [userId]);
    assert.equal(stored.rows[0].token_hash, digest); assert.notEqual(stored.rows[0].token_hash, rawToken); assert.equal(stored.rows[0].valid, true); assert.equal(stored.rows[0].used_at, null);
    await client.query('update password_reset_tokens set used_at=now() where user_id=$1 and used_at is null', [userId]);
    const consumed = await client.query('select used_at from password_reset_tokens where user_id=$1', [userId]); assert.ok(consumed.rows[0].used_at);
    await client.query('begin');
    const transient = await client.query('insert into users(username,email,display_name) values ($1,$2,$3) returning id', [`${unique}_rollback`, `rollback-${unique}@example.test`, 'Rollback']);
    await assert.rejects(() => client.query('insert into user_credentials(user_id,password_hash) values ($1,$2)', [randomUUID(), 'orphan']), /violates foreign key/);
    await client.query('rollback');
    const absent = await client.query('select 1 from users where id=$1', [transient.rows[0].id]); assert.equal(absent.rowCount, 0);
  } finally { client.release(); }
});

after(async () => { if (userId) await pool.query('delete from users where id=$1', [userId]); await pool.end(); });
