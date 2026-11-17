import { expect, test } from '@playwright/test';

test('selects heroes by portrait and reveals sourced skills in the right panel', async ({ page }, testInfo) => {
  await page.route('https://d15f34w2p8l1cc.cloudfront.net/overwatch/*.png', (route) =>
    route.fulfill({
      contentType: 'image/png',
      body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9foAAAAASUVORK5CYII=', 'base64'),
    }));
  await page.goto('./');

  const panel = page.getByRole('complementary', { name: '지형 정보' });
  const roles = panel.getByRole('group', { name: '영웅 역할' });
  const roster = panel.getByRole('group', { name: '영웅 선택' });
  const tracer = roster.getByRole('button', { name: '트레이서', exact: true });
  await expect(tracer).toHaveAttribute('aria-pressed', 'true');
  await expect(tracer.locator('img')).toHaveAttribute('src', /^https:\/\/d15f34w2p8l1cc\.cloudfront\.net\/overwatch\//);
  await expect(tracer.locator('.hero-roster-name')).toHaveText('트레이서');
  const blink = panel.getByRole('button', { name: 'Blink', exact: true });
  await blink.hover();
  const details = panel.getByRole('region', { name: '스킬 상세' });
  await expect(details).toContainText('현재 이동 방향으로 순간이동합니다.');
  await page.getByRole('button', { name: '2D 탑다운' }).hover();
  await expect(details).toHaveCount(0);

  await roles.getByRole('button', { name: '지원', exact: true }).click();
  await roster.getByRole('button', { name: '아나', exact: true }).click();
  await expect(panel.getByRole('heading', { name: '아나의 스킬' })).toBeVisible();
  const grenade = panel.getByRole('button', { name: 'Biotic Grenade', exact: true });
  await grenade.focus();
  await expect(details).toContainText('폭발 피해');
  await expect(details.getByText('60', { exact: true })).toBeVisible();
  await expect(details.getByRole('link', { name: '2026-11 패치 노트' })).toHaveAttribute('href', /2026\/11\//);
  await grenade.press('Escape');
  await expect(details).toHaveCount(0);
  await grenade.click();
  await expect(grenade).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '2D 탑다운' }).hover();
  await expect(details).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('hero-ability-sidebar.png') });
});
