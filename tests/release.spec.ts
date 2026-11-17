import { expect, test } from '@playwright/test';

test('serves the editor, favicon, preview metadata and static recovery page', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const home = await page.goto('./');
  expect(home?.ok()).toBe(true);
  await expect(page).toHaveTitle('Vertactics');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Vertactics');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\/.+\/social-card\.png$/);
  const favicon = await page.locator('link[rel="icon"]').evaluate((element: HTMLLinkElement) => element.href);
  const icon = await page.request.get(favicon);
  expect(icon.ok()).toBe(true);
  expect(icon.headers()['content-type']).toContain('image/png');
  await expect(page.getByTestId('viewport').locator('canvas')).toBeVisible();
  expect(errors).toEqual([]);

  const about = await page.goto('./about.html');
  expect(about?.ok()).toBe(true);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('전장의 높낮이까지,');
  await expect(page.getByRole('radio', { name: '3D' })).toBeChecked();
  await page.locator('label[for="view-flat"]').click();
  await expect(page.getByRole('radio', { name: '2D' })).toBeChecked();
  await page.getByRole('link', { name: /Open map editor/ }).click();
  await expect(page).toHaveTitle('Vertactics');

  const missing = await page.goto(process.env.VERTACTICS_PUBLIC_URL ? './missing-workspace' : './404.html');
  expect(missing?.status()).toBe(process.env.VERTACTICS_PUBLIC_URL ? 404 : 200);
  await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없습니다.' })).toBeVisible();
  await page.getByRole('link', { name: /Open map editor/ }).click();
  await expect(page).toHaveTitle('Vertactics');
});
