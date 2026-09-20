import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const files = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(directory, entry.name)) : entry.name.endsWith('.test.ts') ? [join(directory, entry.name)] : []);
const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', '--test-reporter=dot', ...files('src')], { stdio: 'inherit' });
process.exit(result.status ?? 1);
