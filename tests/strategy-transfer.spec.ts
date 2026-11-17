import { openMap } from './open-map';
import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('saves, restores and transfers a strategy with its map and timed event', async ({ page }) => {
  await page.goto('/');
  const files = page.getByRole('region', { name: '전략 파일' });
  const local = page.getByRole('region', { name: '로컬 전략' });
  const input = files.getByLabel('전략 JSON 가져오기');
  const importJson = (value: unknown) => input.setInputFiles({
    name: 'plan.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value)),
  });

  const map = {
    schemaVersion: 2, id: 'round-trip', name: '전략 전송 지도',
    terrain: [{ id: 'floor', name: '바닥', kind: 'floor', origin: [-8, -1, -8], size: [16, 1, 16] }],
  };
  const strategy = {
    schemaVersion: 1, id: 'example', mapId: map.id, title: '진입 테스트',
    heroes: [{ id: 'tracer-1', heroId: 'tracer', team: 'attack', position: [0, 0, 0], yaw: 90 }],
    annotations: [],
    abilities: [{ id: 'blink-1', heroId: 'tracer', abilityId: 'blink', shape: 'line', range: 5, width: 1,
      angle: 60, direction: 0, verification: 'custom', position: [0, 0, 0], heading: 90, visible: true }],
    timeline: [{ id: 'phase-1', label: '진입', durationMs: 5000,
      poses: [{ heroPlacementId: 'tracer-1', position: [2, 0, 3], yaw: 180 }],
      events: [{ id: 'event-1', abilityPlacementId: 'blink-1', offsetMs: 1000, durationMs: 1200 }],
    }],
  };

  await importJson({ version: 1, map, strategy: { ...strategy, mapId: 'wrong-map' } });
  await expect(files.getByRole('status')).toContainText('읽을 수 없습니다');
  await expect(files.getByRole('button', { name: '전략 파일 열기' })).toHaveCount(0);
  await importJson({ version: 1, map, strategy });
  await files.getByRole('button', { name: '전략 파일 열기' }).click();
  await expect(page.getByRole('heading', { name: map.name })).toBeVisible();
  await local.getByRole('button', { name: '전략 저장', exact: true }).click();
  await expect(local.getByRole('status')).toContainText('저장했습니다');
  await page.reload();
  await local.getByRole('button', { name: '저장본 확인' }).click();
  await local.getByRole('button', { name: '전략 복원' }).click();
  await expect(page.getByRole('heading', { name: map.name })).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await files.getByRole('button', { name: '전략 JSON 내보내기' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('round-trip-strategy.json');
  const exported = JSON.parse(await readFile(await download.path(), 'utf8'));
  expect(exported).toMatchObject({ version: 1, map, strategy: { ...strategy, id: expect.any(String) } });
  await openMap(page, '고저차 테스트 맵');
  await importJson(exported);
  await files.getByRole('button', { name: '전략 파일 열기' }).click();
  await expect(page.getByRole('heading', { name: map.name })).toBeVisible();
  const phases = page.getByRole('region', { name: '전술 단계' });
  await expect(phases.getByRole('textbox', { name: '단계 이름' })).toHaveValue('진입');
  await expect(phases.getByText('Blink · 1 · 1초 · 1.2초 동안')).toBeVisible();
});

test('downloads nonblank PNGs from both active map cameras', async ({ page }) => {
  await page.goto('/');
  const canvas = page.getByTestId('viewport').locator('canvas');
  const captures: Buffer[] = [];
  for (const [mode, name] of [['2d', '2D 탑다운'], ['3d', '3D 원근']] as const) {
    await page.getByRole('button', { name }).click();
    await expect(canvas).toHaveAttribute('data-view-mode', mode);
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '지도 PNG 저장' }).click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe(`elevation-lab-${mode}.png`);
    const bytes = await readFile(await download.path());
    expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG');
    const count = await page.evaluate(async (data) => {
      const image = await createImageBitmap(new Blob([new Uint8Array(data)], { type: 'image/png' }));
      const sample = new OffscreenCanvas(32, 32);
      const context = sample.getContext('2d')!;
      context.drawImage(image, 0, 0, 32, 32);
      image.close();
      const pixels = context.getImageData(0, 0, 32, 32).data;
      const colors = new Set<number>();
      for (let i = 0; i < pixels.length; i += 4) {
        colors.add(pixels[i]! * 65536 + pixels[i + 1]! * 256 + pixels[i + 2]!);
      }
      return colors.size;
    }, Array.from(bytes));
    expect(count).toBeGreaterThan(6);
    captures.push(bytes);
  }
  expect(captures[0]?.equals(captures[1]!)).toBe(false);
});
