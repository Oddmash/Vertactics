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
  await expect(page.getByRole('heading', { level: 1 })).toContainText('다음 교전을');
  await expect(page.getByRole('heading', { name: '전술은 이렇게 만드세요.' })).toBeVisible();
  await expect(page.locator('.hero-map img')).toHaveJSProperty('naturalWidth', 1440);
  await expect(page.locator('.workflow-list img')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: '지금 열 수 있는 지도' })).toBeVisible();
  await expect(page.locator('#maps')).toContainText('왕의 길 A 거점 근사 지도');
  await expect(page.locator('#maps')).toContainText('내전 전장 31개');
  await page.getByRole('link', { name: /Open map editor/ }).click();
  await expect(page).toHaveTitle('Vertactics');

  const missing = await page.goto(process.env.VERTACTICS_PUBLIC_URL ? './missing-workspace' : './404.html');
  expect(missing?.status()).toBe(process.env.VERTACTICS_PUBLIC_URL ? 404 : 200);
  await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없습니다.' })).toBeVisible();
  await page.getByRole('link', { name: /Open map editor/ }).click();
  await expect(page).toHaveTitle('Vertactics');
});
