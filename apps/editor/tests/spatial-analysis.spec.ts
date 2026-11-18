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
