import { spawnSync } from 'node:child_process';
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL is required for test:db'); process.exit(1); }
const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', 'tests/integration/auth-db.test.ts'], { stdio: 'inherit' });
process.exit(result.status ?? 1);
