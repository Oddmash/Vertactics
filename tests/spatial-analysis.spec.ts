import { expect, test } from '@playwright/test';

test('distinguishes blocked and clear stair cross-sections in both map views', async ({ page }) => {
  await page.goto('/');
  const canvas = page.getByTestId('viewport').locator('canvas');
  await page.getByRole('button', { name: '2D 탑다운' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  await page.getByRole('button', { name: '지점 간 시야', exact: true }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  const result = page.getByRole('region', { name: '지점 간 시야 결과' }).getByRole('status');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas has no bounds');
  const scale = Math.max(36 / box.width, 24 / box.height) * 1.22;
  const click = (x: number, z: number) => page.mouse.click(
    box.x + box.width / 2 + x / scale, box.y + box.height / 2 + z / scale,
  );

  await click(-13, 1);
  await click(-6, 1);
  await expect(result).toHaveText('시야 차단: 서쪽 계단');
  await click(-13, 5.5);
  await click(-6, 5.5);
  await expect(result).toHaveText('시야 개방');
  await page.getByRole('button', { name: '3D 원근' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '3d');
  await expect(result).toHaveText('시야 개방');
});

test('keeps hidden terrain in hero analysis and separates collision and sight flags', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByLabel('지도 JSON 가져오기').setInputFiles({
    name: 'analysis-layers.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      schemaVersion: 2, id: 'analysis-layers', name: '공간 분석 검증 지도',
      layers: [{ id: 'base', name: '바닥 층' }, { id: 'walls', name: '벽 층' }],
      terrain: [
        { id: 'floor', layerId: 'base', name: '바닥', kind: 'floor', origin: [-18, -1, -12], size: [36, 1, 24] },
        { id: 'solid', layerId: 'walls', name: '투명 충돌벽', kind: 'wall', origin: [-3, 0, -1], size: [1, 3, 2],
          collision: true, blocksSight: false },
        { id: 'screen', layerId: 'walls', name: '시야 차단벽', kind: 'wall', origin: [2, 0, -1], size: [1, 3, 2],
          collision: false, blocksSight: true },
      ],
    })),
  });
  await expect(page.getByRole('heading', { name: '공간 분석 검증 지도' })).toBeVisible();
  const canvas = page.getByTestId('viewport').locator('canvas');
  await page.getByRole('button', { name: '2D 탑다운' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas has no bounds');
  const scale = Math.max(36 / box.width, 24 / box.height) * 1.22;
  for (const x of [-6, 6]) {
    await page.getByRole('button', { name: '배치 시작' }).click();
    await expect(canvas).toHaveCSS('cursor', 'crosshair');
    await page.mouse.click(box.x + box.width / 2 + x / scale, box.y + box.height / 2);
  }
  await page.getByLabel('시야 확인 대상', { exact: true }).selectOption({ index: 1 });
  const result = page.getByText('시야: 시야 차단벽 · 충돌: 투명 충돌벽', { exact: true });
  await expect(result).toBeVisible();
  await page.getByLabel('표시 층').selectOption('base');
  const terrain = page.getByRole('complementary', { name: '지형 목록' });
  await expect(terrain.getByRole('button', { name: /시야 차단벽/ })).toHaveCount(0);
  await expect(result).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('sightline-hidden-layer.png') });
});
