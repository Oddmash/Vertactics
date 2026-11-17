import { openMap } from './open-map';
import { arch, cpus, platform } from 'node:os';
import { expect, test } from '@playwright/test';

type DrawObservation = {
  drawCalls: number;
  firstDrawAt: number | null;
  pendingInputAt: number | null;
  inputToDrawMs: number | null;
};

test('records a map-rendering baseline with a real Chromium canvas', async ({ page, browser }) => {
  await page.addInitScript(() => {
    const observation: DrawObservation = {
      drawCalls: 0,
      firstDrawAt: null,
      pendingInputAt: null,
      inputToDrawMs: null,
    };
    Object.defineProperty(window, 'vertacticsDrawObservation', { value: observation });
    if (typeof WebGL2RenderingContext === 'undefined') return;
    const prototype = WebGL2RenderingContext.prototype;
    for (const name of ['drawArrays', 'drawArraysInstanced', 'drawElements', 'drawElementsInstanced'] as const) {
      const draw = prototype[name];
      Object.defineProperty(prototype, name, {
        configurable: true,
        value(this: WebGL2RenderingContext, ...args: unknown[]) {
          const now = performance.now();
          observation.drawCalls++;
          observation.firstDrawAt ??= now;
          if (observation.pendingInputAt !== null) {
            observation.inputToDrawMs = now - observation.pendingInputAt;
            observation.pendingInputAt = null;
          }
          return Reflect.apply(draw, this, args);
        },
      });
    }
    document.addEventListener('click', (event) => {
      if (event.target instanceof Element && event.target.closest('.mode-switch')) {
        observation.drawCalls = 0;
        observation.inputToDrawMs = null;
        observation.pendingInputAt = performance.now();
      }
    }, true);
  });
  const observation = () => page.evaluate(() => Reflect.get(window, 'vertacticsDrawObservation') as DrawObservation);
  await page.goto('/');
  const canvas = page.getByTestId('viewport').locator('canvas');
  await expect(canvas).toBeVisible();
  await expect.poll(async () => (await observation()).drawCalls).toBeGreaterThan(0);

  const initial = await observation();
  const navigation = await page.evaluate(() => {
    const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return { domContentLoadedMs: entry.domContentLoadedEventEnd, loadMs: entry.loadEventEnd };
  });
  const results = [];

  for (const [mapId, name] of [['elevation-lab', '고저차 테스트 맵'], ['courtyard', '훈련장 안뜰'], ['kings-row-a', '왕의 길 열기']]) {
    await openMap(page, name!);
    for (const view of ['3D 원근', '2D 탑다운']) {
      await page.getByRole('button', { name: view }).click();
      await expect.poll(async () => (await observation()).inputToDrawMs).not.toBeNull();
      await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      const sample = await observation();
      results.push({ mapId, view, drawCalls: sample.drawCalls, inputToDrawMs: sample.inputToDrawMs });
      await page.getByRole('button', { name: '시점 초기화' }).click();
    }
  }

  const cdp = await page.context().newCDPSession(page);
  const { usedSize: jsHeapBytes } = await cdp.send('Runtime.getHeapUsage');
  await cdp.detach();
  console.log('Vertactics rendering baseline', JSON.stringify({
    platform: platform(), arch: arch(), cpu: cpus()[0]?.model, browser: browser.version(),
    viewport: page.viewportSize(), renderer: 'ANGLE SwiftShader',
    navigation: { ...navigation, firstDrawMs: initial.firstDrawAt },
    jsHeapBytes, results,
  }));
});
