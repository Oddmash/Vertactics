import { expect, test } from '@playwright/test';

test('keeps terrain inspection available across map views', async ({ page, browserName }, testInfo) => {
  await page.goto('/');
  const webgl2 = await page.evaluate(() => {
    const context = document.createElement('canvas').getContext('webgl2');
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(context);
  });
  const viewport = page.getByTestId('viewport');
  if (webgl2 || browserName === 'chromium') {
    await expect(viewport.locator('canvas')).toBeVisible();
    await expect(viewport.getByText(/WebGL 2를 사용할 수 없어/)).toBeHidden();
  } else {
    await expect(viewport.getByText(/WebGL 2를 사용할 수 없어/)).toBeVisible();
  }

  const selectTerrain = page.getByRole('button', { name: '서쪽 고지대 +4 u' });
  const twoD = page.getByRole('button', { name: '2D 탑다운' });
  await selectTerrain.click();
  await twoD.click();
  await expect(twoD).toHaveAttribute('aria-pressed', 'true');
  await expect(selectTerrain).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('complementary', { name: '지형 정보' }).getByText('+4 u')).toBeVisible();
  testInfo.annotations.push({ type: 'WebGL 2', description: webgl2 ? 'rendering' : 'fallback' });
  await page.screenshot({ path: testInfo.outputPath(`compatibility-${webgl2 ? 'canvas' : 'fallback'}.png`) });
});

test('shows a usable workspace when WebGL 2 is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const nativeGetContext = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value(this: HTMLCanvasElement, type: string, options?: unknown) {
        if (type.startsWith('webgl') || type === 'experimental-webgl') return null;
        return Reflect.apply(nativeGetContext, this, [type, options]);
      },
    });
  });
  await page.goto('/');
  await expect(page.getByTestId('viewport').getByText(/WebGL 2를 사용할 수 없어/)).toBeVisible();
  await page.getByRole('button', { name: '서쪽 고지대 +4 u' }).click();
  await expect(page.getByRole('complementary', { name: '지형 정보' }).getByText('+4 u')).toBeVisible();
});
