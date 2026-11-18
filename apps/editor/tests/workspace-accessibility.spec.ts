import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

test('supports keyboard mode changes and preserves browser context menus outside the map', async ({ page }) => {
  await page.goto('./');
  await page.keyboard.press('Tab');

  const twoD = page.getByRole('button', { name: '2D 탑다운' });
  await twoD.focus();
  await expect(twoD).toBeFocused();
  await expect(twoD).toHaveCSS('outline-style', 'solid');
  await expect(twoD).toHaveCSS('outline-color', 'rgb(129, 238, 229)');
  await twoD.press('Enter');
  await expect(twoD).toHaveAttribute('aria-pressed', 'true');
  await expect(twoD).toHaveCSS('transition-duration', '0s');

  const mapView = page.getByRole('group', { name: '지도 보기' });
  expect(await mapView.ariaSnapshot()).toContain('button "2D 탑다운" [pressed]');
  const contrast = await twoD.evaluate((button) => {
    const luminance = (color: string) => (color.match(/\d+/g) ?? []).slice(0, 3)
      .map((channel) => Number(channel) / 255)
      .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
      .reduce((sum, value, index) => sum + value * ([0.2126, 0.7152, 0.0722][index] ?? 0), 0);
    const { color, backgroundColor } = getComputedStyle(button);
    const a = luminance(color);
    const b = luminance(backgroundColor);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  });
  expect(contrast).toBeGreaterThanOrEqual(4.5);

  const contextMenuAllowed = (element: Element) => element.dispatchEvent(new MouseEvent('contextmenu', {
    button: 2, bubbles: true, cancelable: true,
  }));
  const canvas = page.getByTestId('viewport').locator('canvas');
  await expect(canvas).toBeVisible();
  expect(await canvas.evaluate(contextMenuAllowed)).toBe(false);
  expect(await twoD.evaluate(contextMenuAllowed)).toBe(true);

  const help = page.getByRole('link', { name: '도움말' });
  await help.press('Enter');
  const summary = page.locator('#workspace-help');
  await expect(summary).toBeFocused();
  await summary.press('Enter');
  await expect(page.getByText('Esc로 도구를 취소하거나 재생을 종료합니다.')).toBeVisible();
});

test('opens map selection by keyboard and restores focus on dismissal', async ({ page }) => {
  await page.goto('./');
  const trigger = page.getByRole('button', { name: '전장 변경', exact: true });
  await trigger.focus();
  await trigger.press('Enter');
  const modal = page.getByRole('dialog', { name: '전장 변경' });
  await expect(modal).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('draws freehand and two-point markers in fullscreen', async ({ page }) => {
  await page.goto('./');
  const open = page.getByRole('button', { name: '전체 화면', exact: true });
  await open.click();
  await expect(page.locator('.editor')).toHaveAttribute('data-fullscreen', 'true');
  const canvas = page.getByTestId('viewport').locator('canvas');
  const markers = page.getByRole('region', { name: '전술 마커' });
  await markers.getByRole('button', { name: '펜', exact: true }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('Canvas bounds unavailable');
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(x - 14, y + 12);
  await page.mouse.down();
  await page.mouse.move(x, y, { steps: 6 });
  await page.mouse.move(x + 22, y + 12, { steps: 6 });
  await page.mouse.up();
  await expect(markers.getByRole('list', { name: '배치한 마커' }).getByText('펜', { exact: true }).first()).toBeVisible();

  await markers.getByRole('button', { name: '두 점으로 직선' }).click();
  await canvas.click({ position: { x: bounds.width / 2 - 12, y: bounds.height / 2 + 24 } });
  await canvas.click({ position: { x: bounds.width / 2 + 20, y: bounds.height / 2 + 24 } });
  await expect(markers.getByRole('list', { name: '배치한 마커' }).getByRole('listitem')).toHaveCount(2);
  await page.getByRole('button', { name: '전체 화면 종료', exact: true }).click();
  await expect(page.locator('.editor')).toHaveAttribute('data-fullscreen', 'false');
});
