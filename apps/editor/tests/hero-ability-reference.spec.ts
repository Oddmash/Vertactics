import { expect, test } from '@playwright/test';
import { savedHeroPosition } from './workspace-map';

test('selects heroes by portrait and reveals sourced skills in the right panel', async ({ page }) => {
  const externalRequests: string[] = [];
  const origin = new URL(test.info().project.use.baseURL!).origin;
  await page.route('**/*', (route) => {
    if (new URL(route.request().url()).origin === origin) return route.continue();
    externalRequests.push(route.request().url());
    return route.abort();
  });
  await page.goto('./');

  const panel = page.getByRole('complementary', { name: '지형 정보' });
  const roles = panel.getByRole('group', { name: '영웅 역할' });
  const roster = panel.getByRole('group', { name: '영웅 선택' });
  const tracer = roster.getByRole('button', { name: '트레이서', exact: true });
  await expect(tracer).toHaveAttribute('aria-pressed', 'true');
  await expect(tracer.locator('img')).toHaveAttribute('src', /\/images\/heroes\/tracer\.webp$/);
  await expect.poll(() => tracer.locator('img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await expect(tracer.locator('.hero-roster-name')).toHaveText('트레이서');
  const anran = roster.getByRole('button', { name: '안란', exact: true }).locator('img');
  await expect(anran).toHaveAttribute('src', /\/images\/heroes\/anran\.webp$/);
  await expect.poll(() => anran.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  const blink = panel.getByRole('button', { name: '점멸', exact: true });
  await expect(blink.locator('img')).toHaveAttribute('src', /\/images\/abilities\/[a-f0-9]+\.webp$/);
  await expect.poll(() => blink.locator('img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await blink.hover();
  const details = panel.getByRole('tooltip');
  await expect(details).toContainText('현재 이동 방향으로 순간이동합니다.');
  await expect(details).toHaveCSS('position', 'static');
  expect(await details.evaluate((tooltip) => {
    const sources = tooltip.closest('section')?.querySelector('.hero-ability-sources');
    return Boolean(sources && tooltip.getBoundingClientRect().bottom <= sources.getBoundingClientRect().top);
  })).toBe(true);
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
  await expect(panel.getByRole('link', { name: '2026-11-03 패치 노트' })).toHaveAttribute('href', /2026\/11\//);
  await grenade.press('Escape');
  await expect(details).toHaveCount(0);
  await grenade.click();
  await expect(grenade).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '2D 탑다운' }).hover();
  await expect(details).toBeVisible();
  await roster.getByRole('button', { name: '솜브라', exact: true }).click();
  await panel.getByRole('button', { name: '사이버 스페이스', exact: true }).hover();
  await expect(details.getByText('구역 반경')).toBeVisible();
  await expect(details.getByText('5 m', { exact: true })).toBeVisible();
  await expect(details.getByText('3 s', { exact: true })).toBeVisible();
  await panel.getByRole('button', { name: '기관권총', exact: true }).hover();
  await expect(details.getByText('6.5', { exact: true })).toBeVisible();
  await expect(details.getByText('20 m', { exact: true })).toBeVisible();
  await expect(panel.getByRole('link', { name: '2026-10-13 패치 노트' })).toHaveAttribute('href', /#patch-2026-10-13$/);
  await panel.getByRole('button', { name: '긴급 패치', exact: true }).hover();
  await expect(details.getByText('17 m', { exact: true })).toBeVisible();
  await expect(details.getByText('10 s', { exact: true })).toBeVisible();
  await expect(panel.getByRole('link', { name: '2026-10-06 패치 노트' })).toHaveAttribute('href', /#patch-2026-10-06$/);
  await expect(panel.getByRole('link', { name: '2026-11-03 패치 노트' })).toHaveAttribute('href', /#patch-2026-11-03$/);
  await roles.getByRole('button', { name: '돌격', exact: true }).click();
  await roster.getByRole('button', { name: '로드호그', exact: true }).click();
  await panel.getByRole('button', { name: '쓰레기 압축기', exact: true }).focus();
  await expect(details.getByText('75–200', { exact: true })).toBeVisible();
  await expect(details.getByText('6 m', { exact: true })).toBeVisible();
  await expect(details.getByText('10 s', { exact: true })).toBeVisible();
  await roles.getByRole('button', { name: '지원', exact: true }).click();
  await roster.getByRole('button', { name: '키리코', exact: true }).click();
  await panel.getByRole('button', { name: '정화의 방울', exact: true }).focus();
  await expect(details.getByText('4 m', { exact: true })).toBeVisible();
  await expect(details.getByText('0.5 s', { exact: true })).toBeVisible();
  await expect(panel.getByRole('link', { name: '2026-09-08 패치 노트' })).toHaveAttribute('href', /2026\/09\//);
  expect(externalRequests).toEqual([]);
});

test('drops a portrait directly on the 2D map and places it on the selected team', async ({ page }) => {
  await page.goto('./');

  const canvas = page.getByTestId('viewport').locator('canvas');
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  const panel = page.getByRole('complementary', { name: '지형 정보' });
  await panel.getByRole('combobox', { name: '팀', exact: true }).selectOption('defense');
  const tracer = panel.getByRole('group', { name: '영웅 선택' }).getByRole('button', { name: '트레이서', exact: true });
  await tracer.dragTo(canvas);
  const placed = panel.getByRole('list', { name: '배치한 영웅' });
  await expect(placed.getByRole('button', { name: '트레이서 수비팀' })).toBeVisible();
  const map = page.getByTestId('viewport');
  const portrait = map.locator('[data-hero="tracer"] img');
  for (const view of ['2D 탑다운', '3D 원근']) {
    await page.getByRole('button', { name: view }).click();
    await expect(portrait).toBeVisible();
    await expect(portrait).toHaveAttribute('src', /\/images\/heroes\/tracer\.webp$/);
    await expect.poll(() => portrait.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  }
});

test('keeps a hero badge visible when its local portrait fails', async ({ page }) => {
  await page.route('**/images/heroes/tracer.webp', (route) => route.abort());
  await page.goto('./');
  const hero = page.getByRole('group', { name: '영웅 선택' }).getByRole('button', { name: '트레이서', exact: true });
  await expect(hero.locator('[data-image-state="failed"]')).toBeVisible();
  await expect(hero.locator('.image-placeholder')).toHaveText('트레');
  await expect(hero.locator('.image-placeholder')).toBeVisible();

  const canvas = page.getByTestId('viewport').locator('canvas');
  await hero.dragTo(canvas);
  const badge = page.getByTestId('viewport').locator('[data-hero="tracer"][data-image-state="failed"]');
  await expect(badge).toHaveText('트레');
  await expect(badge).toBeVisible();
});

test('moves a held portrait and deletes it only on release over the open trash', async ({ page }, testInfo) => {
  const publicMap = Boolean(process.env.VERTACTICS_PUBLIC_URL);
  const origin = publicMap ? '0, 0, 3' : '0, 0, 0';
  const highGround = publicMap ? '10, 4, 6' : '7, 2, 5';
  const [targetX, targetZ] = publicMap ? [10, 3] : [7, 5];
  await page.goto('./');
  const map = page.getByTestId('viewport');
  const canvas = map.locator('canvas');
  const portrait = map.locator('[data-hero="tracer"]');
  const trash = map.locator('.map-hero-trash');
  const roster = page.getByRole('group', { name: '영웅 선택' });
  const undo = page.getByRole('button', { name: '실행 취소', exact: true });
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  await page.getByRole('checkbox', { name: '격자 스냅' }).check();

  const center = async (locator: typeof canvas): Promise<[number, number]> => {
    const box = await locator.boundingBox();
    if (!box) throw new Error('Missing drag target');
    return [box.x + box.width / 2, box.y + box.height / 2];
  };
  const screen = await canvas.boundingBox();
  if (!screen) throw new Error('Missing map bounds');
  const units = Math.max((publicMap ? 40 : 36) / screen.width, (publicMap ? 46 : 24) / screen.height) * 1.22;
  await roster.getByRole('button', { name: '트레이서', exact: true }).dragTo(canvas);
  await expect(portrait).toBeVisible();
  await expect.poll(() => savedHeroPosition(page)).toBe(origin);
  await expect(trash).toBeHidden();
  await page.mouse.click(screen.x + screen.width / 2 - 6 / units, screen.y + screen.height / 2);
  await expect(portrait).toHaveAttribute('data-selected', 'false');
  await portrait.click();
  await expect(portrait).toHaveAttribute('data-selected', 'true');
  await expect(trash).toBeHidden();
  await page.mouse.move(...await center(portrait));
  await page.mouse.down();
  await expect(trash).toBeVisible();
  await expect(trash).toHaveAttribute('data-open', 'false');
  await page.mouse.move(screen.x + screen.width / 2 + targetX / units, screen.y + screen.height / 2 + targetZ / units, { steps: 8 });
  await expect.poll(() => savedHeroPosition(page)).toBe(origin);
  await page.mouse.up();
  await expect.poll(() => savedHeroPosition(page)).toBe(highGround);
  await undo.click();
  await expect.poll(() => savedHeroPosition(page)).toBe(origin);

  await page.mouse.move(...await center(portrait));
  await page.mouse.down();
  await expect(trash).toBeVisible();
  await page.mouse.move(...await center(trash));
  await expect(trash).toHaveAttribute('data-open', 'true');
  await map.screenshot({ path: testInfo.outputPath('hero-trash-2d.png') });
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(trash).toBeHidden();
  await expect(portrait).toBeVisible();

  await page.getByRole('button', { name: '3D 원근' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '3d');
  await page.mouse.move(...await center(portrait));
  await page.mouse.down();
  await expect(trash).toBeVisible();
  await page.mouse.move(...await center(trash));
  await expect(trash).toHaveAttribute('data-open', 'true');
  await expect(trash).toHaveText('놓아서 삭제');
  await expect(portrait).toBeVisible();
  await map.screenshot({ path: testInfo.outputPath('hero-trash-3d.png') });
  await page.mouse.up();
  await expect(portrait).toHaveCount(0);
  await expect(trash).toBeHidden();
  await undo.click();
  await expect(portrait).toBeVisible();
  await expect.poll(() => savedHeroPosition(page)).toBe(origin);
});

test.describe('touch map', () => {
  test.use({ hasTouch: true, viewport: { width: 430, height: 900 } });

  test('opens the trash under a held touch and deletes on touch release', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Uses Chromium touch dispatch');
    await page.goto('./');
    const map = page.getByTestId('viewport');
    const canvas = map.locator('canvas');
    const portrait = map.locator('[data-hero="tracer"]');
    const trash = map.locator('.map-hero-trash');
    await page.getByRole('button', { name: '지도에서 위치 선택' }).tap();
    await canvas.tap();
    await expect(portrait).toBeVisible();
    const marker = await portrait.boundingBox();
    if (!marker) throw new Error('Missing hero portrait');
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: marker.x + marker.width / 2, y: marker.y + marker.height / 2 }],
    });
    await expect(trash).toBeVisible();
    const target = await trash.boundingBox();
    if (!target) throw new Error('Missing trash target');
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: target.x + target.width / 2, y: target.y + target.height / 2 }],
    });
    await expect(trash).toHaveAttribute('data-open', 'true');
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(portrait).toHaveCount(0);
  });
});
