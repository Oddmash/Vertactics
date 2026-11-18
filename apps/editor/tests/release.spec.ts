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

  const canonicalLanding = 'https://qtaghdi.github.io/Vertactics/about/';
  const about = await page.goto('./about/');
  expect(about?.ok()).toBe(true);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonicalLanding);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', canonicalLanding);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /2D·3D 전술 지도/);
  const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() ?? '');
  expect(schema).toMatchObject({ '@type': 'WebApplication', url: canonicalLanding });
  const robots = await page.request.get('./robots.txt');
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain('Sitemap: https://qtaghdi.github.io/Vertactics/sitemap.xml');
  const sitemap = await page.request.get('./sitemap.xml');
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).toContain(`<loc>${canonicalLanding}</loc>`);
  const shareImage = (await page.locator('meta[property="og:image"]').getAttribute('content'))!;
  expect((await page.request.get(new URL(shareImage).pathname.split('/').at(-1)!)).ok()).toBe(true);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('진입을 설계하다.');
  await expect(page.getByRole('heading', { name: '전장을 읽고, 팀의 움직임을 짜세요.' })).toBeVisible();
  const views = page.getByRole('group', { name: '전장 미리보기 모드' });
  const topDown = views.getByRole('button', { name: '2D' });
  const perspective = views.getByRole('button', { name: '3D' });
  const terrain = page.locator('.terrain-preview');
  const preview = terrain.getByRole('img');
  await expect(perspective).toHaveAttribute('aria-pressed', 'true');
  await expect(preview).toHaveAttribute('src', /terrain-3d\.webp$/);
  await expect(preview).toHaveJSProperty('naturalWidth', 1440);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: '본문 바로가기' })).toBeFocused();
  await topDown.press('Enter');
  await expect(topDown).toBeFocused();
  await expect(topDown).toHaveAttribute('aria-pressed', 'true');
  await expect(perspective).toHaveAttribute('aria-pressed', 'false');
  await expect(preview).toHaveAttribute('src', /terrain-2d\.webp$/);
  await expect(terrain.getByRole('status')).toContainText('진입로와 엄폐물');
  await preview.evaluate((image: HTMLImageElement) => image.decode());
  await perspective.press('Space');
  await expect(perspective).toHaveAttribute('aria-pressed', 'true');
  await expect(terrain.getByRole('status')).toContainText('높이 차이');
  const workflowImages = page.locator('.workflow-feature img');
  await expect(workflowImages).toHaveCount(3);
  for (const image of await workflowImages.all()) {
    await image.scrollIntoViewIfNeeded();
    await image.evaluate((element: HTMLImageElement) => element.decode());
    await expect(image).toHaveJSProperty('naturalWidth', 1440);
  }
  await expect(page.getByRole('heading', { name: '지금 열 수 있는 지도' })).toBeVisible();
  await expect(page.locator('#maps')).toContainText('왕의 길 A 거점 근사 지도');
  await expect(page.locator('#maps')).toContainText('내전 전장 31개');
  await page.goto('./about.html');
  await expect(page).toHaveURL(/\/about\/$/);
  await page.getByRole('link', { name: /Open map editor/ }).click();
  await expect(page).toHaveTitle('Vertactics');
  expect(errors).toEqual([]);

  const missing = await page.goto(process.env.VERTACTICS_PUBLIC_URL ? './missing-workspace' : './404.html');
  expect(missing?.status()).toBe(process.env.VERTACTICS_PUBLIC_URL ? 404 : 200);
  await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없습니다.' })).toBeVisible();
  await page.getByRole('link', { name: /Open map editor/ }).click();
  await expect(page).toHaveTitle('Vertactics');
});


test.describe('narrow product landing', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });

  test('can change the terrain preview by touch without horizontal overflow', async ({ page }) => {
    await page.goto('./about/');
    const views = page.getByRole('group', { name: '전장 미리보기 모드' });
    const topDown = views.getByRole('button', { name: '2D' });
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
    await expect(views).toBeInViewport();
    const size = await topDown.boundingBox();
    expect(size?.width).toBeGreaterThanOrEqual(44);
    expect(size?.height).toBeGreaterThanOrEqual(44);
    await topDown.tap();
    await expect(topDown).toHaveAttribute('aria-pressed', 'true');
    await page.locator('.terrain-preview img').evaluate((image: HTMLImageElement) => image.decode());
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
