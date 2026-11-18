import { expect, test } from '@playwright/test';

test('creates, updates, duplicates and deletes saved strategies while keeping the original', async ({ page }) => {
  await page.goto('/');
  const local = page.getByRole('region', { name: '로컬 전략' });
  const title = local.getByRole('textbox', { name: '전략 이름' });
  await title.fill('안뜰 진입');
  await local.getByRole('button', { name: '전략 저장', exact: true }).click();
  await expect(local.getByRole('status')).toContainText('전략을 저장했습니다.');
  await expect(title).toHaveValue('안뜰 진입');
  await title.fill('안뜰 우회');
  await local.getByRole('button', { name: '새 이름으로 저장' }).click();
  await expect(local.getByRole('status')).toContainText('전략을 저장했습니다.');
  await title.fill('안뜰 우회 수정');
  await local.getByRole('button', { name: '전략 저장', exact: true }).click();
  await expect(local.getByRole('status')).toContainText('전략을 저장했습니다.');

  await page.reload();
  await local.getByRole('button', { name: '저장본 확인' }).click();
  const list = local.getByRole('list', { name: '저장된 전략' });
  await expect(list.getByRole('listitem')).toHaveCount(2);
  await expect(list.getByRole('listitem').first()).toContainText('안뜰 우회 수정');
  await list.getByRole('button', { name: /안뜰 진입/ }).click();
  await local.getByRole('button', { name: '전략 복제' }).click();
  await expect(list.getByRole('listitem')).toHaveCount(3);
  await expect(list.getByRole('listitem').first()).toContainText('안뜰 진입 복제');
  await local.getByRole('button', { name: '전략 삭제', exact: true }).click();
  await local.getByRole('button', { name: '삭제 취소' }).click();
  await expect(list.getByRole('listitem')).toHaveCount(3);
  await local.getByRole('button', { name: '전략 삭제', exact: true }).click();
  await local.getByRole('button', { name: '삭제 확인' }).click();
  await expect(list.getByRole('listitem')).toHaveCount(2);
  await page.reload();
  await local.getByRole('button', { name: '저장본 확인' }).click();
  await expect(list.getByRole('button', { name: /복제/ })).toHaveCount(0);
  await list.getByRole('button', { name: /안뜰 진입/ }).click();
  await local.getByRole('button', { name: '전략 복원' }).click();
  await expect(title).toHaveValue('안뜰 진입');
});

test('opens a version-one workspace draft alongside new saved strategies', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('vertactics-strategy', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('drafts');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('drafts', 'readwrite');
      transaction.objectStore('drafts').put({
        version: 1,
        map: { schemaVersion: 1, id: 'legacy-map', name: '예전 지도',
          terrain: [{ id: 'floor', name: '바닥', kind: 'floor', origin: [-4, -1, -4], size: [8, 1, 8] }],
        },
        strategy: { schemaVersion: 1, id: 'old-id', mapId: 'legacy-map', title: '예전 전략', heroes: [] },
      }, 'workspace');
      transaction.oncomplete = () => { db.close(); resolve(); };
      transaction.onabort = () => { db.close(); reject(transaction.error); };
    };
  }));
  const local = page.getByRole('region', { name: '로컬 전략' });
  await local.getByRole('button', { name: '전략 저장', exact: true }).click();
  await expect(local.getByRole('status')).toContainText('전략을 저장했습니다.');
  await local.getByRole('button', { name: '저장본 확인' }).click();
  const list = local.getByRole('list', { name: '저장된 전략' });
  await expect(list.getByRole('listitem')).toHaveCount(2);
  await list.getByRole('button', { name: /예전 전략/ }).click();
  await local.getByRole('button', { name: '전략 복원' }).click();
  await expect(page.getByRole('heading', { name: '예전 지도' })).toBeVisible();
  const title = local.getByRole('textbox', { name: '전략 이름' });
  await title.fill('이전 저장본 갱신');
  await local.getByRole('button', { name: '전략 저장', exact: true }).click();
  await expect(local.getByRole('status')).toContainText('전략을 저장했습니다.');
  await local.getByRole('button', { name: '저장본 확인' }).click();
  await expect(list.getByRole('listitem')).toHaveCount(2);
  await expect(list.getByRole('listitem').first()).toContainText('이전 저장본 갱신');
});
