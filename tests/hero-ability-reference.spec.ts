import { expect, test } from '@playwright/test';

test('selects heroes by portrait and reveals sourced skills in the right panel', async ({ page }) => {
  await page.route('https://d15f34w2p8l1cc.cloudfront.net/overwatch/*.png', (route) =>
    route.fulfill({
      contentType: 'image/png',
      body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9foAAAAASUVORK5CYII=', 'base64'),
    }));
  const icon = 'https://d15f34w2p8l1cc.cloudfront.net/overwatch/test-ability.png';
  await page.route('https://overfast-api.tekrop.fr/heroes/**', (route) => {
    const url = new URL(route.request().url());
    expect(url.searchParams.get('locale')).toBe('ko-kr');
    return route.fulfill({
      headers: { 'access-control-allow-origin': '*' },
      json: { abilities: url.pathname.endsWith('/ana')
        ? [{ name: '생체 수류탄', description: '아군을 치유하고 적의 치유를 차단합니다.', icon }]
        : [{ name: '점멸', description: '현재 이동 방향으로 순간이동합니다.', icon }] },
    });
  });
  await page.goto('./');

  const panel = page.getByRole('complementary', { name: '지형 정보' });
  const roles = panel.getByRole('group', { name: '영웅 역할' });
  const roster = panel.getByRole('group', { name: '영웅 선택' });
  const tracer = roster.getByRole('button', { name: '트레이서', exact: true });
  await expect(tracer).toHaveAttribute('aria-pressed', 'true');
  await expect(tracer.locator('img')).toHaveAttribute('src', /^https:\/\/d15f34w2p8l1cc\.cloudfront\.net\/overwatch\//);
  await expect(tracer.locator('.hero-roster-name')).toHaveText('트레이서');
  const blink = panel.getByRole('button', { name: '점멸', exact: true });
  await expect(blink.locator('img')).toHaveAttribute('src', icon);
  await blink.hover();
  const details = panel.getByRole('tooltip');
  await expect(details).toContainText('현재 이동 방향으로 순간이동합니다.');
  await page.getByRole('button', { name: '2D 탑다운' }).hover();
  await expect(details).toHaveCount(0);

  await panel.getByRole('button', { name: '지도에서 위치 선택' }).click();
  await expect(panel.getByText('배치할 지면을 클릭하세요.')).toBeVisible();
  await roles.getByRole('button', { name: '지원', exact: true }).click();
  await expect(panel.getByText('배치할 지면을 클릭하세요.')).toHaveCount(0);
  await roster.getByRole('button', { name: '아나', exact: true }).click();
  await expect(panel.getByRole('heading', { name: '아나의 스킬' })).toBeVisible();
  const grenade = panel.getByRole('button', { name: '생체 수류탄', exact: true });
  await grenade.focus();
  await expect(details).toContainText('폭발 피해');
  await expect(details.getByText('60', { exact: true })).toBeVisible();
  await expect(panel.getByRole('link', { name: '2026-11 패치 노트' })).toHaveAttribute('href', /2026\/11\//);
  await grenade.press('Escape');
  await expect(details).toHaveCount(0);
  await grenade.click();
  await expect(grenade).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '2D 탑다운' }).hover();
  await expect(details).toBeVisible();
});

test('drops a portrait directly on the 2D map and places it on the selected team', async ({ page }) => {
  await page.route('https://overfast-api.tekrop.fr/heroes/**', (route) => route.abort());
  await page.goto('./');

  const canvas = page.getByTestId('viewport').locator('canvas');
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  const panel = page.getByRole('complementary', { name: '지형 정보' });
  await panel.getByRole('combobox', { name: '팀', exact: true }).selectOption('defense');
  const tracer = panel.getByRole('group', { name: '영웅 선택' }).getByRole('button', { name: '트레이서', exact: true });
  await tracer.dragTo(canvas);
  const placed = panel.getByRole('list', { name: '배치한 영웅' });
  await expect(placed.getByRole('button', { name: '트레이서 수비팀' })).toBeVisible();
});
