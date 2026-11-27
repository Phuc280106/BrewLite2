import path from 'path';
import { defineConfig, devices } from '@playwright/test';

process.env.NODE_PATH = path.resolve(__dirname, 'node_modules');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('module').Module._initPaths();

export default defineConfig({
  testDir: '../../tests/e2e',
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
