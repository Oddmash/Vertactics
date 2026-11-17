import { expect, test } from '@playwright/test';

test('shares a strategy as read-only, plays it across views and duplicates it for editing', async ({ page, context }) => {
  await page.goto('/');
  const canvas = page.getByTestId('viewport').locator('canvas');
  await page.getByRole('button', { name: '2D 탑다운' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  await page.getByRole('button', { name: '배치 시작' }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  await canvas.click();
  const stages = page.getByRole('region', { name: '전술 단계' });
  await stages.getByRole('button', { name: '단계 추가' }).click();
  await stages.getByRole('button', { name: '현재 영웅 위치 기록' }).click();
  await page.getByRole('button', { name: '공유 링크 만들기' }).click();
  const link = page.getByRole('textbox', { name: '읽기 전용 공유 링크' });
  await expect(link).toHaveValue(/#strategy=[a-zA-Z0-9_-]+$/);
  const url = await link.inputValue();

  const recipient = await context.newPage();
  await recipient.goto(url);
  await expect(recipient.getByText('읽기 전용 전략', { exact: true })).toBeVisible();
  await expect(recipient.getByRole('button', { name: '배치 시작' })).toHaveCount(0);
  await expect(recipient.getByRole('region', { name: '로컬 전략' })).toHaveCount(0);
  await recipient.getByRole('button', { name: '전략 재생', exact: true }).click();
  await recipient.getByRole('button', { name: '일시정지' }).click();
  const seek = recipient.getByRole('slider', { name: '재생 위치' });
  await seek.press('End');
  await recipient.getByRole('button', { name: '2D 탑다운' }).click();
  await expect(recipient.getByTestId('viewport').locator('canvas')).toHaveAttribute('data-view-mode', '2d');
  await expect(seek).toHaveValue('5000');
  const json = recipient.waitForEvent('download');
  await recipient.getByRole('button', { name: '전략 JSON 내보내기' }).click();
  expect((await json).suggestedFilename()).toBe('elevation-lab-strategy.json');

  await recipient.getByRole('button', { name: '편집용 복제' }).click();
  await expect(recipient).toHaveURL((location) => location.hash === '');
  await expect(recipient.getByRole('button', { name: '배치 시작' })).toBeVisible();
  await expect(recipient.getByText('기록한 영웅 1명')).toBeVisible();
  await recipient.getByRole('button', { name: '현재 단계 삭제' }).click();
  await expect(recipient.getByText('기록한 영웅 1명')).toHaveCount(0);
  await expect(stages.getByText('기록한 영웅 1명')).toBeVisible();
});

test('rejects a malformed share without loading an editor draft', async ({ page }) => {
  await page.goto('/#strategy=invalid');
  await expect(page.getByRole('heading', { name: '공유 링크를 열 수 없습니다.' })).toBeVisible();
  await expect(page.getByRole('button', { name: '편집용 복제' })).toHaveCount(0);
  await page.getByRole('button', { name: '편집기 열기' }).click();
  await expect(page.getByRole('button', { name: '배치 시작' })).toBeVisible();
});
