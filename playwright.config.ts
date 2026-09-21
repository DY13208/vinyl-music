import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, workers: 1, timeout: 45000,
  use: { baseURL: 'http://127.0.0.1:43180', viewport: { width: 390, height: 844 }, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: [
    { command: 'npx tsx tests/fixtures/auth-server.ts', url: 'http://127.0.0.1:43181/api/health', env: { DATABASE_URL: process.env.E2E_DATABASE_URL || process.env.DATABASE_URL || '', REDIS_URL: process.env.E2E_REDIS_URL || process.env.REDIS_URL || '', AUTH_ORIGIN: 'http://127.0.0.1:43180' }, reuseExistingServer: false },
    { command: 'npx vite --host 127.0.0.1 --port 43180 --strictPort', url: 'http://127.0.0.1:43180', env: { DEV_API_PORT: '43181' }, reuseExistingServer: false },
  ],
});
