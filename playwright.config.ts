import { defineConfig, devices } from '@playwright/test';

const database = 'postgresql://football:football@127.0.0.1:5432/football_test?schema=live_browser';

export default defineConfig({
  testDir: './e2e', fullyParallel: false, workers: 1, timeout: 60_000,
  use: { baseURL: 'http://127.0.0.1:5180', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1080 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'pnpm --filter @fb/core exec prisma migrate deploy && pnpm --filter @fb/core seed && pnpm --filter @fb/api exec tsx test/live-browser-server.ts',
      url: 'http://127.0.0.1:3100/api/health', timeout: 120_000, reuseExistingServer: false,
      env: { DATABASE_URL: database, NODE_ENV: 'test', DEV_TOOLS: 'true', PORT: '3100', REDIS_URL: '',
        APP_PUBLIC_URL: 'http://127.0.0.1:5180', COOKIE_SECURE: 'false', CORS_ORIGIN: 'http://127.0.0.1:5180' },
    },
    {
      command: 'pnpm --filter @fb/web exec vite --host 127.0.0.1 --port 5180 --strictPort',
      url: 'http://127.0.0.1:5180', reuseExistingServer: false,
      env: { VITE_API_PROXY_TARGET: 'http://127.0.0.1:3100' },
    },
  ],
});
