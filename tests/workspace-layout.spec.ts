import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test('keeps the map, controls and selected terrain accessible on a narrow touch screen', async ({ page }, testInfo) => {
  await page.goto('/');

  const viewport = page.getByTestId('viewport');
  const canvas = viewport.locator('canvas');
  await expect(canvas).toBeVisible();
  await expect.poll(() => viewport.evaluate((element) => element.clientHeight)).toBeGreaterThan(370);
  await expect.poll(() => viewport.evaluate((element) => element.getBoundingClientRect().top)).toBeLessThan(430);
  const mapActions = page.getByRole('button', { name: '지도 관리' });
  const displayOptions = page.getByRole('button', { name: '표시 설정', exact: true });
  await expect(page.getByRole('button', { name: '새 지도', exact: true })).toBeHidden();
  await mapActions.tap();
  await expect(page.getByRole('button', { name: '새 지도', exact: true })).toBeVisible();
  await mapActions.tap();
  await expect(page.getByRole('button', { name: '지도 PNG 저장' })).toBeHidden();
  await displayOptions.tap();
  await expect(page.getByRole('button', { name: '지도 PNG 저장' })).toBeVisible();
  await displayOptions.tap();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({ path: testInfo.outputPath('vertactics-narrow-default.png') });

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
  await page.getByRole('button', { name: '거리 측정' }).tap();
  await expect(viewport).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: '거리 측정' })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('link', { name: '속성' }).tap();
  await expect(page.getByRole('heading', { name: '지형 정보' })).toBeFocused();
  await expect(page.getByRole('complementary', { name: '지형 정보' }).getByText('+4 u')).toBeVisible();
});
