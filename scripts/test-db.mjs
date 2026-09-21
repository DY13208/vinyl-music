import { Client } from 'pg';
const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL is required for test:db'); process.exit(1); }
const client = new Client({ connectionString: url });
try {
  await client.connect();
  const tables = await client.query("select table_name from information_schema.tables where table_schema='public' and table_name in ('users','user_credentials','password_reset_tokens') order by table_name");
  if (tables.rowCount !== 3) throw new Error('auth tables are missing; run npm run db:migrate first');
  await client.query('begin');
  const first = await client.query("insert into users(username,email,display_name) values ('db_test_user','db-test@example.test','DB Test') returning id");
  await client.query('insert into user_credentials(user_id,password_hash) values ($1,$2)', [first.rows[0].id, 'argon2id-test']);
  await client.query('rollback');
  console.log('auth database constraints smoke test passed');
} catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }
finally { await client.end().catch(() => undefined); }
