import { defineConfig } from '@playwright/test';
import config from './playwright.config';

const deployment = process.env.VERTACTICS_PUBLIC_URL;
if (!deployment) throw new Error('VERTACTICS_PUBLIC_URL is required');

export default defineConfig({
  ...config,
  webServer: undefined,
  retries: 2,
  testMatch: [
    '**/release.spec.ts',
    '**/strategy-share.spec.ts',
    '**/workspace-locale.spec.ts',
    '**/map-catalogue.spec.ts',
    '**/hero-ability-reference.spec.ts',
  ],
  use: {
    ...config.use,
    baseURL: deployment.endsWith('/') ? deployment : `${deployment}/`,
  },
});
