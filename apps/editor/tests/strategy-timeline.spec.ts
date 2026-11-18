import { expect, test } from '@playwright/test';

test('edits and restores a phase with hero poses and an ability event', async ({ page }) => {
  await page.goto('/');
  const canvas = page.getByTestId('viewport').locator('canvas');
  await page.getByRole('button', { name: '2D 탑다운' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  const map = {
    schemaVersion: 2, id: 'legacy-timeline', name: '기존 전술 검증 지도',
    terrain: [{ id: 'floor', name: '바닥', kind: 'floor', origin: [-8, -1, -8], size: [16, 1, 16] }],
  };
  const strategy = {
    schemaVersion: 1, id: 'legacy-plan', mapId: map.id, title: '기존 전술',
    heroes: [{ id: 'tracer-1', heroId: 'tracer', team: 'attack', position: [0, 0, 0], yaw: 0 }],
    annotations: [],
    abilities: [{ id: 'blink-1', heroId: 'tracer', abilityId: 'blink', shape: 'line', range: 5, width: 1,
      angle: 60, direction: 0, verification: 'custom', position: [0, 0, 0], heading: 0, visible: true }],
    timeline: [],
  };
  await page.getByLabel('전략 JSON 가져오기').setInputFiles({
    name: 'legacy-plan.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ version: 1, map, strategy })),
  });
  await page.getByRole('button', { name: '전략 파일 열기' }).click();
  await expect(page.getByRole('button', { name: '점멸 표시 중' })).toBeVisible();

  const stage = page.getByRole('region', { name: '전술 단계', exact: true });
  await stage.getByRole('button', { name: '단계 추가' }).click();
  await stage.getByRole('textbox', { name: '단계 이름' }).fill('진입');
  await stage.getByRole('spinbutton', { name: '단계 길이 (초)' }).fill('4');
  await stage.getByRole('button', { name: '단계 설정 적용' }).click();
  await stage.getByRole('button', { name: '현재 영웅 위치 기록' }).click();
  await expect(stage.getByText('기록한 영웅 1명')).toBeVisible();
  await stage.getByRole('spinbutton', { name: '이벤트 시작 (초)' }).fill('4');
  await stage.getByRole('button', { name: '능력 이벤트 추가' }).click();
  await expect(stage.getByRole('status')).toContainText('단계 안에');
  await stage.getByRole('spinbutton', { name: '이벤트 시작 (초)' }).fill('1.5');
  await stage.getByRole('button', { name: '능력 이벤트 추가' }).click();
  const event = stage.getByRole('list', { name: '단계 능력 이벤트' }).getByText('점멸 · 1 · 1.5초 · 1초 동안');
  await expect(event).toBeVisible();
  await stage.getByRole('button', { name: '현재 단계 삭제' }).click();
  await expect(stage.getByLabel('현재 단계')).toHaveCount(0);
  await page.getByRole('button', { name: '실행 취소', exact: true }).click();
  await expect(event).toBeVisible();

  const local = page.getByRole('region', { name: '로컬 전략' });
  await local.getByRole('button', { name: '전략 저장', exact: true }).click();
  await expect(local.getByRole('status')).toContainText('전략을 저장했습니다.');
  await page.reload();
  await local.getByRole('button', { name: '저장본 확인' }).click();
  await local.getByRole('button', { name: '전략 복원' }).click();
  await expect(stage.getByRole('textbox', { name: '단계 이름' })).toHaveValue('진입');
  await expect(stage.getByRole('spinbutton', { name: '단계 길이 (초)' })).toHaveValue('4');
  await expect(stage.getByText('기록한 영웅 1명')).toBeVisible();
  await expect(event).toBeVisible();

  await page.getByRole('button', { name: '전략 재생', exact: true }).click();
  const playback = page.getByRole('region', { name: '전략 재생', exact: true });
  await playback.getByRole('button', { name: '일시정지' }).click();
  await playback.getByLabel('재생 속도').selectOption('2');
  const seek = playback.getByRole('slider', { name: '재생 위치' });
  await seek.press('Home');
  await expect(seek).toHaveValue('0');
  await seek.press('PageUp');
  const intermediate = await seek.inputValue();
  expect(Number(intermediate)).toBeGreaterThan(0);
  expect(Number(intermediate)).toBeLessThan(4000);
  await page.getByRole('button', { name: '2D 탑다운' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  await expect(seek).toHaveValue(intermediate);
  await seek.press('Home');
  const beforeEvent = await canvas.screenshot();
  for (let step = 0; step < 5; step++) await seek.press('PageUp');
  const duringEvent = await seek.inputValue();
  expect(Number(duringEvent)).toBeGreaterThanOrEqual(1500);
  expect(Number(duringEvent)).toBeLessThan(2500);
  await expect.poll(async () => (await canvas.screenshot()).equals(beforeEvent)).toBe(false);
  await page.getByRole('button', { name: '3D 원근' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '3d');
  await expect(seek).toHaveValue(duringEvent);
  await expect(playback.getByLabel('재생 속도')).toHaveValue('2');
  await seek.press('End');
  await expect(seek).toHaveValue('4000');
  await playback.getByRole('button', { name: '재생', exact: true }).click();
  await expect(playback.getByRole('button', { name: '일시정지' })).toBeVisible();
  await playback.getByRole('button', { name: '편집으로 돌아가기' }).click();
  await expect(playback).toHaveCount(0);
  await expect(event).toBeVisible();
});
