import { defineConfig } from '@playwright/test';

const fixtureOutput = '../../dist/e2e';
const fixturePreview = [
  `pnpm exec vite build --mode e2e --outDir ${fixtureOutput}`,
  `cp -R ../../dist/about ${fixtureOutput}/about`,
  `cp ../../dist/robots.txt ../../dist/sitemap.xml ${fixtureOutput}`,
  `pnpm exec vite preview --outDir ${fixtureOutput} --host localhost --port 4173 --strictPort`,
].join(' && ');

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  webServer: {
    command: fixturePreview,
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
});
