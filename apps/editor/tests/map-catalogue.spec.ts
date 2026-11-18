import { expect, test } from '@playwright/test';

test('changes maps through mode cards and zooms the King’s Row reference', async ({ page }) => {
  await page.goto('./');
  const open = page.getByRole('button', { name: '전장 변경' });
  await open.click();
  const library = page.getByRole('dialog', { name: '전장 변경' });
  await expect(library.locator('.map-card')).toHaveCount(31);
  await expect(library.locator('.map-card img[src*="/images/maps/"]')).toHaveCount(31);
  const busan = library.locator('.map-card img[src$="/busan.webp"]');
  await busan.scrollIntoViewIfNeeded();
  await expect.poll(() => busan.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
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

test('plans across both views of the original Tidal Relay map', async ({ page }, testInfo) => {
  await page.goto('./');
  await page.getByRole('button', { name: '전장 변경', exact: true }).click();
  const library = page.getByRole('dialog', { name: '전장 변경' });
  await library.getByRole('button', { name: '조수 중계소', exact: true }).click();
  await expect(page.getByRole('heading', { name: '조수 중계소', exact: true })).toBeVisible();

  const canvas = page.getByTestId('viewport').locator('canvas');
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  const locations = page.getByRole('combobox', { name: '주요 위치' });
  const wholeMap = await canvas.screenshot();
  await locations.click();
  await page.getByRole('listbox').getByRole('option', { name: '정비 교량 상층', exact: true }).click();
  await expect.poll(async () => (await canvas.screenshot()).equals(wholeMap)).toBe(false);
  await locations.press('Home');
  await locations.press('Enter');
  await expect(locations).toHaveText('전장 전체');
  await expect.poll(async () => (await canvas.screenshot()).equals(wholeMap)).toBe(true);

  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas has no bounds');
  const scale = Math.max(44 / box.width, 32 / box.height) * 1.22;
  const pick = (x: number, z: number) => page.mouse.click(
    box.x + box.width / 2 + x / scale, box.y + box.height / 2 + z / scale,
  );

  await page.getByRole('button', { name: '지도에서 위치 선택' }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  await pick(0, 10);
  const inspector = page.getByRole('complementary', { name: '지형 정보' });
  await expect(inspector.getByRole('heading', { name: '트레이서', exact: true })).toBeVisible();
  await expect(inspector.getByText('-2 u', { exact: true })).toBeVisible();

  const markers = page.getByRole('region', { name: '전술 마커' });
  await markers.getByRole('button', { name: '마커 그리기' }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  await pick(-12, 10);
  await pick(1, 10);
  const points = markers.getByRole('list', { name: '마커 지점' }).getByRole('listitem');
  await expect(points).toHaveCount(2);

  await page.getByRole('button', { name: '지점 간 시야', exact: true }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  await pick(-18, -3);
  await pick(-12, -3);
  const sight = page.getByRole('region', { name: '지점 간 시야 결과' }).getByRole('status');
  await expect(sight).toHaveText('시야 차단: 서쪽 방벽');
  await page.screenshot({ path: testInfo.outputPath('tidal-relay-2d.png') });

  await page.getByRole('button', { name: '3D 원근' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '3d');
  await expect(sight).toHaveText('시야 차단: 서쪽 방벽');
  await expect(points).toHaveCount(2);
  await expect(inspector.getByRole('list', { name: '배치한 영웅' }).getByText('트레이서', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('tidal-relay-3d.png') });

  await page.getByRole('combobox', { name: '언어' }).selectOption('en');
  await expect(page.getByRole('heading', { name: 'Tidal Relay', exact: true })).toBeVisible();
});
