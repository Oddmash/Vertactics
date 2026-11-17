import { expect, test } from '@playwright/test';

test('serves the editor, favicon, preview metadata and static recovery page', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const home = await page.goto('/');
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

  await page.goto('/404.html');
  await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없습니다.' })).toBeVisible();
  await page.getByRole('link', { name: /Open map editor/ }).click();
  await expect(page).toHaveTitle('Vertactics');
});
