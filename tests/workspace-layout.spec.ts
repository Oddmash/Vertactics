import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test('keeps the map, controls and selected terrain accessible on a narrow touch screen', async ({ page }, testInfo) => {
  await page.goto('/');

  const viewport = page.getByTestId('viewport');
  const canvas = viewport.locator('canvas');
  await expect(canvas).toBeVisible();
  await expect.poll(() => viewport.evaluate((element) => element.clientHeight)).toBeGreaterThan(260);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({ path: testInfo.outputPath('vertactics-narrow-3d.png') });

  const twoD = page.getByRole('button', { name: '2D 탑다운' });
  await expect.poll(() => twoD.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  await page.getByRole('link', { name: '지형 목록' }).tap();
  await expect(page.getByRole('heading', { name: '지형 목록' })).toBeFocused();
  await page.getByRole('button', { name: '서쪽 고지대 +4 u' }).tap();

  await twoD.tap();
  await expect(twoD).toHaveAttribute('aria-pressed', 'true');
  await expect(canvas).toBeVisible();
  await page.getByRole('link', { name: '지도 보기' }).tap();
  await page.screenshot({ path: testInfo.outputPath('vertactics-narrow-2d.png') });
  await page.getByRole('link', { name: '속성' }).tap();
  await expect(page.getByRole('heading', { name: '지형 정보' })).toBeFocused();
  await expect(page.getByRole('complementary', { name: '지형 정보' }).getByText('+4 u')).toBeVisible();
});
