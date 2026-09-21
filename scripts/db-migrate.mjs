import { readFile } from 'node:fs/promises';
import { Client } from 'pg';
const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL is required'); process.exit(1); }
const client = new Client({ connectionString: url });
try { await client.connect(); await client.query(await readFile(new URL('../migrations/001_auth.sql', import.meta.url), 'utf8')); console.log('auth migration applied'); }
catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }
finally { await client.end().catch(() => undefined); }
