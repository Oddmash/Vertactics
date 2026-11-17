import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

test('supports keyboard mode changes and preserves browser context menus outside the map', async ({ page }) => {
  await page.goto('./');
  await page.keyboard.press('Tab');

  const twoD = page.getByRole('button', { name: '2D 탑다운' });
  await twoD.focus();
  await expect(twoD).toBeFocused();
  await expect(twoD).toHaveCSS('outline-style', 'solid');
  await expect(twoD).toHaveCSS('outline-color', 'rgb(115, 233, 197)');
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

test('keeps the map selector native and restores keyboard focus after dismissal', async ({ page }) => {
  await page.goto('./');
  await page.keyboard.press('Tab');

  const map = page.getByRole('combobox', { name: '지도', exact: true });
  await map.focus();
  await expect(map).toBeFocused();
  await expect(map).toHaveCSS('outline-color', 'rgb(115, 233, 197)');

  const supportsPicker = await map.evaluate(() =>
    CSS.supports('appearance: base-select') && CSS.supports('selector(::picker(select))'));
  if (supportsPicker) {
    await map.press('Space');
    await expect(map).toHaveCSS('appearance', 'base-select');
    await expect.poll(() => map.evaluate((select) => select.matches(':open'))).toBe(true);
    await page.keyboard.press('Escape');
    await expect.poll(() => map.evaluate((select) => select.matches(':open'))).toBe(false);
    await expect(map).toBeFocused();
  }

  await map.selectOption('kings-row-a');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('왕의 길');
});
