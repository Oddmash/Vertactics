import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export const clickWestHighGround = async (page: Page) => {
  const canvas = page.getByTestId('viewport').locator('canvas');
  await page.getByRole('button', { name: '2D 탑다운' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas has no bounds');
  const scale = Math.max(36 / box.width, 24 / box.height) * 1.22;
  await canvas.click({ position: { x: box.width / 2 - 9.5 / scale, y: box.height / 2 - 5 / scale } });
};

export const savedHeroPosition = (page: Page) => page.evaluate(() => {
  const raw = localStorage.getItem('vertactics-workspace-recovery');
  const point: number[] | undefined = raw ? JSON.parse(raw).strategy.heroes.at(-1)?.position : undefined;
  return point?.map((coordinate) => Number(coordinate.toFixed(2))).join(', ');
});
