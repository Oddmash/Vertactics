import { defineConfig } from '@playwright/test';
import config from './playwright.config';

export default defineConfig({
  ...config,
  testMatch: '**/browser-compatibility.spec.ts',
  use: {
    baseURL: config.use?.baseURL,
    viewport: config.use?.viewport,
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
});
