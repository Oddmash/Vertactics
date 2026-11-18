import { expect, test } from '@playwright/test';

test('recovers unsaved work after reload and keeps the named snapshot intact', async ({ page }) => {
  await page.goto('/');
  const recovery = page.getByRole('region', { name: '작업 복구' });
  const local = page.getByRole('region', { name: '로컬 전략' });
  const heroes = page.getByRole('list', { name: '배치한 영웅' }).getByRole('listitem');
  const canvas = page.getByTestId('viewport').locator('canvas');
  await page.getByRole('button', { name: '2D 탑다운' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  await page.getByRole('button', { name: '지도에서 위치 선택' }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  await canvas.click();
  await expect(recovery.getByRole('status')).toHaveText('작업을 자동 저장했습니다.');
  await local.getByRole('button', { name: '전략 저장', exact: true }).click();
  await expect(local.getByRole('status')).toContainText('전략을 저장했습니다.');

  await page.getByRole('group', { name: '영웅 역할' }).getByRole('button', { name: '지원' }).click();
  await page.getByRole('group', { name: '영웅 선택' }).getByRole('button', { name: '아나', exact: true }).click();
  await page.getByRole('button', { name: '지도에서 위치 선택' }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas has no bounds');
  await page.mouse.click(box.x + box.width / 2 - 90, box.y + box.height / 2);
  await expect(heroes).toHaveCount(2);
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await page.reload();

  await recovery.getByRole('button', { name: '이전 작업 복구' }).click();
  await expect(heroes).toHaveCount(2);
  await local.getByRole('button', { name: '저장본 확인' }).click();
  await local.getByRole('button', { name: '전략 복원' }).click();
  await expect(heroes).toHaveCount(1);
});

test('reports malformed recovery and a write failure without blocking named saves', async ({ page }) => {
  await page.addInitScript(() => {
    const key = 'vertactics-workspace-recovery';
    localStorage.setItem(key, '{');
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException('Storage is full', 'QuotaExceededError');
      original.call(this, name, value);
    };
  });
  await page.goto('/');
  const recovery = page.getByRole('region', { name: '작업 복구' });
  const local = page.getByRole('region', { name: '로컬 전략' });
  await expect(recovery.getByRole('status')).toHaveText('이전 작업 데이터를 읽을 수 없습니다.');
  await page.getByRole('button', { name: '지도에서 위치 선택' }).click();
  await page.getByTestId('viewport').locator('canvas').click();
  await expect(recovery.getByRole('status')).toContainText('작업을 자동 저장할 수 없습니다.');
  await local.getByRole('button', { name: '전략 저장', exact: true }).click();
  await expect(local.getByRole('status')).toContainText('전략을 저장했습니다.');
});
