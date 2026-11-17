import { expect, test } from '@playwright/test';

test('changes maps through mode cards and zooms the King’s Row reference', async ({ page }) => {
  await page.route('https://overfast-api.tekrop.fr/static/maps/**', (route) =>
    route.fulfill({
      contentType: 'image/png',
      body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9foAAAAASUVORK5CYII=', 'base64'),
    }));
  await page.goto('./');
  const open = page.getByRole('button', { name: '전장 변경' });
  await open.click();
  const library = page.getByRole('dialog', { name: '전장 변경' });
  await expect(library.locator('.map-card')).toHaveCount(31);
  await expect(library.locator('.map-card img')).toHaveCount(31);
  const control = library.getByRole('region', { name: '쟁탈' });
  await expect(control.getByText('부산', { exact: true })).toBeVisible();
  await expect(control.getByText('2D 지형 대조 중')).toHaveCount(7);
  await library.getByRole('button', { name: '왕의 길 열기' }).click();
  await expect(library).toBeHidden();
  await expect(page.getByRole('heading', { name: '왕의 길 A 거점 (근사 지도)' })).toBeVisible();
  const canvas = page.getByTestId('viewport').locator('canvas');
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  const locations = page.getByRole('combobox', { name: '주요 위치' });
  const wholeMap = await canvas.screenshot();
  await locations.click();
  const pointA = page.getByRole('option', { name: 'A 점령 거점', exact: true });
  await expect(pointA).toHaveCSS('text-align', 'center');
  await pointA.click();
  await expect.poll(async () => (await canvas.screenshot()).equals(wholeMap)).toBe(false);
  await locations.press('Home');
  await locations.press('Enter');
  await expect(locations).toHaveText('전장 전체');
  await expect.poll(async () => (await canvas.screenshot()).equals(wholeMap)).toBe(true);

  await page.getByRole('combobox', { name: '언어' }).selectOption('en');
  const englishOpen = page.getByRole('button', { name: 'Change map' });
  await englishOpen.click();
  await expect(page.getByRole('button', { name: 'Open King’s Row' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(englishOpen).toBeFocused();
});
