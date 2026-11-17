import { expect, test } from '@playwright/test';

test('switches from a pending sight probe to hero placement without applying both tools', async ({ page }) => {
  await page.goto('/');
  const canvas = page.getByTestId('viewport').locator('canvas');
  const sight = page.getByRole('button', { name: '지점 간 시야', exact: true });
  const result = page.getByRole('region', { name: '지점 간 시야 결과' });
  await page.getByRole('button', { name: '2D 탑다운' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  await sight.click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  await canvas.click();
  await expect(result.getByRole('status')).toHaveText('시야 목표점을 선택하세요.');
  await page.getByRole('button', { name: '지도에서 위치 선택' }).click();
  await expect(sight).toHaveAttribute('aria-pressed', 'false');
  await expect(result).toHaveCount(0);
  await canvas.click();
  await expect(page.getByRole('list', { name: '배치한 영웅' }).getByRole('listitem')).toHaveCount(1);
});
