import { readFile } from 'node:fs/promises';
import { PerspectiveCamera, Vector3 } from 'three';
import { expect, test } from '@playwright/test';

test('renders and manipulates the same elevated terrain in both views', async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/');

  const canvas = page.getByTestId('viewport').locator('canvas');
  const threeD = page.getByRole('button', { name: '3D 원근' });
  const twoD = page.getByRole('button', { name: '2D 탑다운' });
  const reset = page.getByRole('button', { name: '시점 초기화' });
  const inspector = page.getByRole('complementary', { name: '지형 정보' });
  await expect(threeD).toHaveAttribute('aria-pressed', 'true');
  await expect(canvas).toBeVisible();
  await expect(page.getByText('WebGL 2를 사용할 수 없어', { exact: false })).toBeHidden();
  await page.getByRole('button', { name: '서쪽 고지대 +4 u' }).click();
  await expect(inspector.getByText('+4 u')).toBeVisible();

  const visibleTerrain = async () => {
    const pixels = (await canvas.screenshot()).toString('base64');
    return page.evaluate(async (base64) => {
      const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
      const image = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
      const bitmap = new OffscreenCanvas(image.width, image.height);
      const context = bitmap.getContext('2d');
      if (!context) throw new Error('Unable to inspect screenshot pixels');
      context.drawImage(image, 0, 0);
      const { data } = context.getImageData(0, 0, image.width, image.height);
      image.close();

      let teal = 0;
      let amber = 0;
      for (let index = 0; index < data.length; index += 4) {
        const red = data[index]!;
        const green = data[index + 1]!;
        const blue = data[index + 2]!;
        if (green > 90 && green > red + 18 && green > blue + 5) teal++;
        if (red > 110 && red > green + 14 && green > blue + 10) amber++;
      }
      return teal > 300 && amber > 300;
    }, pixels);
  };

  await expect.poll(visibleTerrain).toBe(true);
  const initial3d = await canvas.screenshot();
  await page.screenshot({ path: testInfo.outputPath('vertactics-3d.png') });

  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas has no bounds');
  const drag = async (button: 'left' | 'right') => {
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down({ button });
    await page.mouse.move(x + 100, y + 60, { steps: 8 });
    await page.mouse.up({ button });
  };
  const expectCameraChange = async (before: Buffer) => {
    await expect.poll(async () => (await canvas.screenshot()).equals(before)).toBe(false);
  };

  await drag('left');
  await expectCameraChange(initial3d);
  const rotated = await canvas.screenshot();
  await drag('right');
  await expectCameraChange(rotated);
  const panned = await canvas.screenshot();
  await page.mouse.wheel(0, -420);
  await expectCameraChange(panned);
  await reset.click();
  await expect.poll(async () => (await canvas.screenshot()).equals(initial3d)).toBe(true);

  await twoD.click();
  await expect(twoD).toHaveAttribute('aria-pressed', 'true');
  await expectCameraChange(initial3d);
  await expect.poll(visibleTerrain).toBe(true);
  await expect(inspector.getByText('서쪽 고지대')).toBeVisible();
  await expect(inspector.getByText('+4 u')).toBeVisible();
  const initial2d = await canvas.screenshot();
  await page.screenshot({ path: testInfo.outputPath('vertactics-2d.png') });

  await drag('left');
  await expectCameraChange(initial2d);
  const panned2d = await canvas.screenshot();
  await page.mouse.wheel(0, -420);
  await expectCameraChange(panned2d);
  await reset.click();
  await expect.poll(async () => (await canvas.screenshot()).equals(initial2d)).toBe(true);

  const worldUnitsPerPixel = Math.max(36 / box.width, 24 / box.height) * 1.22;
  const clickWorld = (x: number, z: number) => page.mouse.click(
    box.x + box.width / 2 + x / worldUnitsPerPixel,
    box.y + box.height / 2 + z / worldUnitsPerPixel,
  );
  await clickWorld(0, 0);
  await expect(inspector.getByText('중앙 바닥')).toBeVisible();
  await clickWorld(6, -8.6);
  await expect(inspector.getByText('북쪽 벽')).toBeVisible();
  await clickWorld(-9.5, 2.9375);
  await expect(inspector.getByText('서쪽 계단')).toBeVisible();
  await clickWorld(10.5, 6);
  await expect(inspector.getByText('동쪽 고지대')).toBeVisible();
  await expect(inspector.getByText('+2 u')).toBeVisible();

  await threeD.click();
  await expect(threeD).toHaveAttribute('aria-pressed', 'true');
  await expect(inspector.getByText('+2 u')).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('places and moves a hero across views, then undoes and redoes elevation changes', async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/');
  const twoD = page.getByRole('button', { name: '2D 탑다운' });
  const threeD = page.getByRole('button', { name: '3D 원근' });
  const canvas = page.getByTestId('viewport').locator('canvas');
  const inspector = page.getByRole('complementary', { name: '지형 정보' });
  await expect(canvas).toBeVisible();
  await twoD.click();
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');

  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas has no bounds');
  const unitsPerPixel = Math.max(36 / box.width, 24 / box.height) * 1.22;
  const clickWorld = (x: number, z: number) => page.mouse.click(
    box.x + box.width / 2 + x / unitsPerPixel,
    box.y + box.height / 2 + z / unitsPerPixel,
  );

  await page.getByRole('button', { name: '배치 시작' }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  await clickWorld(6, -8.6);
  await expect(page.getByText('배치할 지면을 클릭하세요.')).toBeVisible();
  await clickWorld(0, 0);
  await expect(inspector.getByText('트레이서')).toBeVisible();
  await expect(inspector.getByText('0 u', { exact: true })).toBeVisible();

  await inspector.getByRole('button', { name: '이동', exact: true }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  await clickWorld(-9.5, -5);
  await expect(inspector.getByText('+4 u')).toBeVisible();
  const coordinates = inspector.locator('dl div').filter({ hasText: '좌표 (X, Y, Z)' }).locator('dd');
  const worldPosition = await coordinates.innerText();
  await threeD.click();
  await expect(canvas).toHaveAttribute('data-view-mode', '3d');
  await expect(inspector.getByText('+4 u')).toBeVisible();
  await expect(inspector.getByText('공격팀')).toBeVisible();
  await expect(coordinates).toHaveText(worldPosition);
  await page.screenshot({ path: testInfo.outputPath('vertactics-hero-placement.png') });

  await page.getByRole('button', { name: '실행 취소', exact: true }).click();
  await expect(inspector.getByText('0 u', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '다시 실행', exact: true }).click();
  await expect(inspector.getByText('+4 u')).toBeVisible();

  await inspector.getByRole('button', { name: '45° 회전' }).click();
  await expect(inspector.getByText('45°', { exact: true })).toBeVisible();
  await inspector.getByRole('button', { name: '팀 전환' }).click();
  await expect(inspector.getByText('수비팀')).toBeVisible();
  await inspector.getByRole('button', { name: '삭제' }).click();
  await expect(page.getByRole('list', { name: '배치한 영웅' })).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test('edits route waypoints and carries the annotation across views and history', async ({ page }) => {
  await page.goto('/');
  const canvas = page.getByTestId('viewport').locator('canvas');
  await page.getByRole('button', { name: '2D 탑다운' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  const tools = page.getByRole('region', { name: '전술 마커' });
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas has no bounds');
  const scale = Math.max(36 / box.width, 24 / box.height) * 1.22;
  const click = (x: number, z: number) => page.mouse.click(
    box.x + box.width / 2 + x / scale, box.y + box.height / 2 + z / scale,
  );
  await tools.getByRole('button', { name: '마커 그리기' }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  await click(-6, 1);
  await expect(tools.getByText('두 번째 지점을 클릭하세요.')).toBeVisible();
  await click(0, 1);
  const points = tools.getByRole('list', { name: '마커 지점' }).getByRole('listitem');
  await expect(points).toHaveCount(2);
  await tools.getByRole('button', { name: '지점 추가' }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  await click(7, 5);
  await expect(points).toHaveCount(3);
  await page.getByRole('button', { name: '3D 원근' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '3d');
  await expect(points).toHaveCount(3);
  await tools.getByRole('button', { name: '지점 3 삭제' }).click();
  await expect(points).toHaveCount(2);
  await page.getByRole('button', { name: '실행 취소', exact: true }).click();
  await expect(points).toHaveCount(3);
});


test('draws each marker shape and edits a note in the shared view', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const canvas = page.getByTestId('viewport').locator('canvas');
  const tools = page.getByRole('region', { name: '전술 마커' });
  await page.getByRole('button', { name: '2D 탑다운' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');

  const click = async (x: number, z: number) => {
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas has no bounds');
    const scale = Math.max(36 / box.width, 24 / box.height) * 1.22;
    await page.mouse.click(box.x + box.width / 2 + x / scale, box.y + box.height / 2 + z / scale);
  };
  const markerList = tools.getByRole('list', { name: '배치한 마커' });
  for (const [index, kind] of ['line', 'circle', 'area', 'note'].entries()) {
    await tools.getByLabel('유형').selectOption(kind);
    await tools.getByRole('button', { name: '마커 그리기' }).click();
    await expect(canvas).toHaveCSS('cursor', 'crosshair');
    await click(-4, 1 + index * 2);
    if (kind !== 'note') {
      await expect(tools.getByText('두 번째 지점을 클릭하세요.')).toBeVisible();
      await click(0, 2 + index * 2);
    }
    await expect(markerList.getByRole('listitem')).toHaveCount(index + 1);
  }

  await tools.getByRole('textbox', { name: '이름' }).fill('집결 지점');
  await tools.getByRole('button', { name: '이름 저장' }).click();
  await expect(markerList.getByText('집결 지점')).toBeVisible();
  await page.getByRole('button', { name: '3D 원근' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '3d');
  await expect(markerList.getByText('집결 지점')).toBeVisible();
  const markerView = await canvas.screenshot();
  const markers = page.getByRole('checkbox', { name: '마커 표시' });
  await markers.uncheck();
  await expect.poll(async () => (await canvas.screenshot()).equals(markerView)).toBe(false);
  await expect(markerList.getByText('집결 지점')).toBeVisible();
  await expect(tools.getByRole('button', { name: '마커 그리기' })).toBeDisabled();
  await markers.check();
  await expect.poll(async () => (await canvas.screenshot()).equals(markerView)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('vertactics-markers.png') });
  await tools.getByRole('button', { name: '마커 삭제' }).click();
  await expect(markerList.getByRole('listitem')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('snaps a placement, locks edits, and keeps hidden layers in the strategy', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '2D 탑다운' }).click();
  const canvas = page.getByTestId('viewport').locator('canvas');
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  const inspector = page.getByRole('complementary', { name: '지형 정보' });
  const place = page.getByRole('button', { name: '배치 시작' });
  await page.getByRole('checkbox', { name: '격자 스냅' }).check();
  await place.click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  await place.press('Escape');
  await expect(canvas).not.toHaveCSS('cursor', 'crosshair');
  await place.click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');

  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas has no bounds');
  const scale = Math.max(36 / box.width, 24 / box.height) * 1.22;
  await page.mouse.click(box.x + box.width / 2 + 7.3 / scale, box.y + box.height / 2 + 5.2 / scale);
  await expect(inspector.getByText('7, 2, 5', { exact: true })).toBeVisible();
  const placed = await canvas.screenshot();
  const heroes = page.getByRole('checkbox', { name: '영웅 표시' });
  await heroes.uncheck();
  await expect.poll(async () => (await canvas.screenshot()).equals(placed)).toBe(false);
  await expect(place).toBeDisabled();
  await expect(page.getByRole('list', { name: '배치한 영웅' }).getByRole('listitem')).toHaveCount(1);
  await heroes.check();
  await expect.poll(async () => (await canvas.screenshot()).equals(placed)).toBe(true);

  const lock = page.getByRole('checkbox', { name: '편집 잠금' });
  await lock.check();
  await expect(place).toBeDisabled();
  await expect(page.getByRole('button', { name: '마커 그리기' })).toBeDisabled();
  await expect(inspector.getByRole('button', { name: '삭제' })).toBeDisabled();
  await lock.press('Control+z');
  await expect(inspector.getByText('7, 2, 5', { exact: true })).toBeVisible();
  await lock.uncheck();
  await lock.press('Control+z');
  await expect(page.getByRole('list', { name: '배치한 영웅' })).toHaveCount(0);
  await lock.press('Control+Shift+z');
  await expect(inspector.getByText('7, 2, 5', { exact: true })).toBeVisible();
  await inspector.getByRole('button', { name: '이동', exact: true }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  await page.mouse.click(box.x + box.width / 2 - 9.4 / scale, box.y + box.height / 2 + 2.94 / scale);
  await expect(inspector.getByText('-9, 2, 3', { exact: true })).toBeVisible();
});


test('picks stacked floors and places and selects heroes in both views', async ({ page }) => {
  await page.goto('/');
  const canvas = page.getByTestId('viewport').locator('canvas');
  const inspector = page.getByRole('complementary', { name: '지형 정보' });
  const layer = page.getByLabel('표시 층');
  const place = page.getByRole('button', { name: '배치 시작' });
  await page.getByRole('button', { name: '2D 탑다운' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas has no bounds');
  const scale = Math.max(36 / box.width, 24 / box.height) * 1.22;
  const clickTopDown = (x: number, z: number) =>
    page.mouse.click(box.x + box.width / 2 + x / scale, box.y + box.height / 2 + z / scale);
  await clickTopDown(0, -5.5);
  await expect(inspector.getByRole('heading', { name: '상층 통로' })).toBeVisible();
  await layer.selectOption('ground');
  await expect(page.getByRole('button', { name: /상층 통로/ })).toHaveCount(0);
  await place.click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  await clickTopDown(0, -5.5);
  await expect(inspector.getByText('0 u', { exact: true })).toBeVisible();
  await clickTopDown(5, 9);
  await expect(inspector.getByRole('heading', { name: '중앙 바닥' })).toBeVisible();
  await clickTopDown(0, -5.5);
  await expect(inspector.getByRole('heading', { name: '트레이서' })).toBeVisible();

  await page.getByRole('button', { name: '3D 원근' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '3d');
  await page.getByRole('checkbox', { name: '격자 스냅' }).check();
  const perspective = new PerspectiveCamera(39, box.width / box.height, 0.072, 432);
  perspective.position.set(36 * 0.62, 1.675 + 36 * 0.68, 36 * 0.85);
  perspective.lookAt(0, 1.675, 0);
  perspective.updateMatrixWorld();
  const clickPerspective = (x: number, y: number, z: number) => {
    const point = new Vector3(x, y, z).project(perspective);
    return page.mouse.click(box.x + (point.x + 1) * box.width / 2, box.y + (1 - point.y) * box.height / 2);
  };
  await place.click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  await clickPerspective(0, 0, 0);
  await expect(inspector.getByText('0, 0, 0', { exact: true })).toBeVisible();
  await clickPerspective(5, 0, 6);
  await clickPerspective(0, 0.3, 0);
  await expect(inspector.getByText('0, 0, 0', { exact: true })).toBeVisible();
  await inspector.getByRole('button', { name: '이동', exact: true }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  await clickPerspective(-3, 0, 3);
  await expect(inspector.getByText('-3, 0, 3', { exact: true })).toBeVisible();
});

test('commits a continuous hero drag as one undoable edit', async ({ page }) => {
  await page.goto('/');
  const canvas = page.getByTestId('viewport').locator('canvas');
  const inspector = page.getByRole('complementary', { name: '지형 정보' });
  await page.getByRole('button', { name: '2D 탑다운' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  await page.getByRole('checkbox', { name: '격자 스냅' }).check();
  const screen = async (x: number, z: number): Promise<[number, number]> => {
    const current = await canvas.boundingBox();
    if (!current) throw new Error('Canvas has no bounds');
    const units = Math.max(36 / current.width, 24 / current.height) * 1.22;
    return [current.x + current.width / 2 + x / units, current.y + current.height / 2 + z / units];
  };
  await page.getByRole('button', { name: '배치 시작' }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  await page.mouse.click(...await screen(0, 1));
  await expect(inspector.getByText('0, 0, 1', { exact: true })).toBeVisible();
  await inspector.getByRole('button', { name: '드래그 이동' }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  await page.mouse.move(...await screen(0, 1));
  await page.mouse.down();
  const [x, y] = await screen(7, 5);
  await page.mouse.move(x, y, { steps: 12 });
  await expect(inspector.getByText('0, 0, 1', { exact: true })).toBeVisible();
  const preview = inspector.locator('dl div').filter({ hasText: '이동 미리보기' }).locator('dd');
  await expect(preview).toHaveText('7, 2, 5');
  const destination = await preview.innerText();
  await page.mouse.up();
  await expect(inspector.getByText(destination, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '실행 취소', exact: true }).click();
  await expect(inspector.getByText('0, 0, 1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '다시 실행', exact: true }).click();
  await expect(inspector.getByText(destination, { exact: true })).toBeVisible();
});

test('switches maps without losing plans and registers validated JSON', async ({ page }) => {
  await page.goto('/');
  const catalogue = page.getByLabel('지도', { exact: true });
  const canvas = page.getByTestId('viewport').locator('canvas');
  const placements = page.getByRole('list', { name: '배치한 영웅' });
  await page.getByRole('button', { name: '2D 탑다운' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  await page.getByRole('button', { name: '배치 시작' }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas has no bounds');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(placements.getByRole('listitem')).toHaveCount(1);
  await catalogue.selectOption('courtyard');
  await expect(page.getByRole('heading', { name: '훈련장 안뜰' })).toBeVisible();
  await expect(placements).toHaveCount(0);
  await catalogue.selectOption('elevation-lab');
  await expect(placements.getByRole('listitem')).toHaveCount(1);

  const input = page.getByLabel('지도 JSON 가져오기');
  await input.setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
  await expect(page.getByText('지도 JSON을 읽을 수 없습니다.')).toBeVisible();
  await input.setInputFiles({
    name: 'custom.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({
      schemaVersion: 1, id: 'custom', name: '사용자 지도',
      terrain: [{ id: 'base', name: '바닥', kind: 'floor', origin: [-4, -1, -4], size: [8, 1, 8] }],
    })),
  });
  await expect(catalogue).toHaveValue('custom');
  await expect(page.getByRole('heading', { name: '사용자 지도' })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: '지도 JSON 저장' }).click();
  const exported = await download;
  expect(exported.suggestedFilename()).toBe('custom.json');
  expect(JSON.parse(await readFile(await exported.path(), 'utf8'))).toMatchObject({ schemaVersion: 2, id: 'custom' });
});

test('creates, edits and restores terrain using the shared map view', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '새 지도', exact: true }).click();
  await expect(page.getByRole('heading', { name: '새 지도', exact: true })).toBeVisible();
  const tools = page.getByRole('region', { name: '지도 편집', exact: true });
  await tools.getByRole('button', { name: '블록 추가' }).click();
  await tools.getByRole('textbox', { name: '블록 이름' }).fill('연습 벽');
  await tools.getByLabel('지형 유형').selectOption('wall');
  await tools.getByRole('group', { name: '크기' }).getByRole('spinbutton', { name: 'Y' }).fill('3');
  await tools.getByRole('button', { name: '블록 저장' }).click();
  await expect(page.getByRole('button', { name: /연습 벽 \+3 u/ })).toBeVisible();
  await tools.getByRole('button', { name: '블록 복제' }).click();
  const duplicate = page.getByRole('button', { name: /연습 벽 복제/ });
  await expect(duplicate).toBeVisible();
  await tools.getByRole('button', { name: '지도 실행 취소' }).click();
  await expect(duplicate).toHaveCount(0);
  await tools.getByRole('button', { name: '지도 다시 실행' }).click();
  await expect(duplicate).toBeVisible();
  await duplicate.click();
  await tools.getByRole('button', { name: '블록 삭제', exact: true }).click();
  await expect(duplicate).toHaveCount(0);
});

test('manages map layers and transforms their terrain without losing blocks', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '새 지도', exact: true }).click();
  const tools = page.getByRole('region', { name: '지도 편집', exact: true });
  const layerFilter = page.getByLabel('표시 층');
  await tools.getByRole('textbox', { name: '새 층 이름' }).fill('발코니');
  await tools.getByRole('button', { name: '층 추가' }).click();
  await layerFilter.selectOption({ label: '발코니' });
  await tools.getByRole('button', { name: '블록 추가' }).click();
  const coordinates = tools.getByRole('group', { name: '좌표', exact: true });
  const size = tools.getByRole('group', { name: '크기', exact: true });
  await coordinates.getByRole('spinbutton', { name: 'X', exact: true }).fill('1.2');
  await size.getByRole('spinbutton', { name: 'X', exact: true }).fill('6');
  await tools.getByRole('button', { name: '블록 저장' }).click();
  await tools.getByRole('button', { name: '격자에 맞추기' }).click();
  await expect(coordinates.getByRole('spinbutton', { name: 'X', exact: true })).toHaveValue('1');
  await tools.getByRole('button', { name: '90° 회전' }).click();
  await expect(size.getByRole('spinbutton', { name: 'Z', exact: true })).toHaveValue('6');

  const balcony = tools.getByRole('form', { name: '발코니' });
  await balcony.getByRole('textbox', { name: '층 이름' }).fill('상층');
  await balcony.getByRole('button', { name: '층 이름 저장' }).click();
  await expect(layerFilter.getByRole('option', { name: '상층' })).toHaveCount(1);
  await tools.getByRole('form', { name: '상층' }).getByRole('button', { name: '층 삭제' }).click();
  await expect(layerFilter).toHaveCount(0);
  await expect(page.getByRole('button', { name: /새 블록/ })).toBeVisible();
  await tools.getByRole('button', { name: '지도 실행 취소' }).click();
  await expect(layerFilter.getByRole('option', { name: '상층' })).toHaveCount(1);
});

test('duplicates multiple terrain blocks and undoes them together', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '지도 편집 모드' }).click();
  await page.getByRole('button', { name: /북쪽 벽/ }).click();
  await page.getByRole('button', { name: /동쪽 벽/ }).click({ modifiers: ['Shift'] });
  await expect(page.getByText('2개 선택', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '선택 블록 복제' }).click();
  await expect(page.getByRole('button', { name: /북쪽 벽 복제/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /동쪽 벽 복제/ })).toBeVisible();
  await page.getByRole('button', { name: '지도 실행 취소' }).click();
  await expect(page.getByRole('button', { name: /벽 복제/ })).toHaveCount(0);
});

test('places and drags heroes at continuous ramp elevations', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('지도', { exact: true }).selectOption('courtyard');
  await page.getByRole('button', { name: '2D 탑다운' }).click();
  const canvas = page.getByTestId('viewport').locator('canvas');
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  await page.getByRole('checkbox', { name: '격자 스냅' }).check();
  await page.getByRole('button', { name: '배치 시작' }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas has no bounds');
  const units = Math.max(24 / box.width, 18 / box.height) * 1.22;
  const point = (x: number): [number, number] => [box.x + box.width / 2 + x / units, box.y + box.height / 2];
  await page.mouse.click(...point(2.6));
  const inspector = page.getByRole('complementary', { name: '지형 정보' });
  await expect(inspector.getByText('3, 1.5, 0', { exact: true })).toBeVisible();
  await inspector.getByRole('button', { name: '드래그 이동' }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  await page.mouse.move(...point(3));
  await page.mouse.down();
  const [x, y] = point(1.2);
  await page.mouse.move(x, y, { steps: 5 });
  await page.mouse.up();
  await expect(inspector.getByText('1, 0.5, 0', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '3D 원근' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '3d');
  await expect(inspector.getByText('1, 0.5, 0', { exact: true })).toBeVisible();
});

test('opens the approximate Kings Row blockout and places a hero on Point A', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByLabel('지도', { exact: true }).selectOption('kings-row-a');
  await expect(page.getByRole('heading', { name: /왕의 길 A 거점/ })).toBeVisible();
  await expect(page.getByText(/미검증 · 40 × 46 u/)).toBeVisible();
  await page.getByRole('button', { name: '2D 탑다운' }).click();
  const canvas = page.getByTestId('viewport').locator('canvas');
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  await page.getByRole('checkbox', { name: '격자 스냅' }).check();
  await page.getByRole('button', { name: '배치 시작' }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas has no bounds');
  const units = Math.max(40 / box.width, 46 / box.height) * 1.22;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2 - 11 / units);
  const inspector = page.getByRole('complementary', { name: '지형 정보' });
  await expect(inspector.getByText('0, 0.04, -8', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('kings-row-a-2d.png') });
  await page.getByRole('button', { name: '3D 원근' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '3d');
  await expect(inspector.getByText('0, 0.04, -8', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('kings-row-a-3d.png') });
  await page.getByLabel('표시 층').selectOption('upper');
  await expect(page.getByRole('button', { name: /수비 측 고지대/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /A 점령 구역/ })).toHaveCount(0);
});

test('shows a blocked hero sightline in both map views', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: '2D 탑다운' }).click();
  const canvas = page.getByTestId('viewport').locator('canvas');
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  const add = async (z: number) => {
    await page.getByRole('button', { name: '배치 시작' }).click();
    await expect(canvas).toHaveCSS('cursor', 'crosshair');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas has no bounds');
    const units = Math.max(36 / box.width, 24 / box.height) * 1.22;
    await page.mouse.click(box.x + box.width / 2 + 6 / units, box.y + box.height / 2 + z / units);
  };
  await add(-11);
  await expect(page.getByRole('list', { name: '배치한 영웅' }).getByRole('listitem')).toHaveCount(1);
  await add(-6);
  const target = page.getByLabel('시야 확인 대상', { exact: true });
  const before = await canvas.screenshot();
  await target.selectOption({ index: 1 });
  const result = page.getByText('시야: 북쪽 벽 · 충돌: 북쪽 벽');
  await expect(result).toBeVisible();
  await expect.poll(async () => (await canvas.screenshot()).equals(before)).toBe(false);
  await page.screenshot({ path: testInfo.outputPath('blocked-sightline-2d.png') });
  await page.getByRole('button', { name: '3D 원근' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '3d');
  await expect(result).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('blocked-sightline-3d.png') });
  const withSightline = await canvas.screenshot();
  await target.selectOption('');
  await expect(result).toHaveCount(0);
  await expect.poll(async () => (await canvas.screenshot()).equals(withSightline)).toBe(false);
});

test('measures height and distance across surfaces and keeps the result through view changes', async ({ page }) => {
  await page.goto('/');
  const canvas = page.getByTestId('viewport').locator('canvas');
  await page.getByRole('button', { name: '2D 탑다운' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  await page.getByRole('checkbox', { name: '격자 스냅' }).check();
  await page.getByRole('button', { name: '거리 측정', exact: true }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  const click = async (x: number, z: number) => {
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas has no bounds');
    const units = Math.max(36 / box.width, 24 / box.height) * 1.22;
    await page.mouse.click(box.x + box.width / 2 + x / units, box.y + box.height / 2 + z / units);
  };
  await click(0, 5);
  const result = page.getByRole('region', { name: '측정 결과' });
  await expect(result.getByText('두 번째 지점을 선택하세요.')).toBeVisible();
  await click(7, 5);
  await expect(result.getByText('7 u', { exact: true })).toBeVisible();
  await expect(result.getByText('+2 u', { exact: true })).toBeVisible();
  await expect(result.getByText('7.28 u', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '3D 원근' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '3d');
  await expect(result.getByText('7.28 u', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '측정 지우기' }).click();
  await expect(result.getByText('첫 번째 지점을 선택하세요.')).toBeVisible();
});

test('shows the selected hero role, official source and abilities', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '2D 탑다운' }).click();
  const canvas = page.getByTestId('viewport').locator('canvas');
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  await page.getByLabel('영웅', { exact: true }).selectOption('ana');
  await page.getByRole('button', { name: '배치 시작' }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  await canvas.click();
  const inspector = page.getByRole('complementary', { name: '지형 정보' });
  await expect(inspector.getByRole('heading', { name: '아나' })).toBeVisible();
  await inspector.getByText('영웅 정보 · 지원', { exact: true }).click();
  await expect(inspector.getByText('Sleep Dart', { exact: true }).and(inspector.locator('li'))).toBeVisible();
  await expect(inspector.getByRole('link', { name: 'Blizzard 영웅 정보' })).toHaveAttribute(
    'href', 'https://overwatch.blizzard.com/en-us/heroes/ana/',
  );
});

test('renders a custom hero ability preview in both map views and hides it on request', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: '2D 탑다운' }).click();
  const canvas = page.getByTestId('viewport').locator('canvas');
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  await page.getByRole('button', { name: '배치 시작' }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  await canvas.click();
  const inspector = page.getByRole('complementary', { name: '지형 정보' });
  await inspector.getByText('능력 범위 미리보기', { exact: true }).click();
  await inspector.getByLabel('능력', { exact: true }).selectOption('blink');
  await inspector.getByLabel('미리보기 형태', { exact: true }).selectOption('cone');
  await inspector.getByLabel('범위 (u)', { exact: true }).fill('8');
  const before = await canvas.screenshot();
  await inspector.getByRole('button', { name: '범위 표시' }).click();
  await expect(inspector.getByText('Blink · 8 u')).toBeVisible();
  await expect(inspector.getByText('사용자 설정 · 지도 단위 (u)')).toBeVisible();
  await expect.poll(async () => (await canvas.screenshot()).equals(before)).toBe(false);
  await page.screenshot({ path: testInfo.outputPath('ability-preview-2d.png') });
  await page.getByRole('button', { name: '3D 원근' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '3d');
  await expect(inspector.getByText('Blink · 8 u')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('ability-preview-3d.png') });
  const withPreview = await canvas.screenshot();
  await inspector.getByRole('button', { name: '범위 숨기기' }).click();
  await expect(inspector.getByText('Blink · 8 u')).toHaveCount(0);
  await expect.poll(async () => (await canvas.screenshot()).equals(withPreview)).toBe(false);
});

test('places and edits an independent ability across the map views', async ({ page }, testInfo) => {
  await page.goto('/');
  const canvas = page.getByTestId('viewport').locator('canvas');
  const placed = page.getByRole('region', { name: '배치한 능력' });
  await page.getByRole('button', { name: '2D 탑다운' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas has no bounds');
  const unitsPerPixel = Math.max(36 / box.width, 24 / box.height) * 1.22;
  const clickWorld = (x: number, z: number) => page.mouse.click(
    box.x + box.width / 2 + x / unitsPerPixel,
    box.y + box.height / 2 + z / unitsPerPixel,
  );

  await page.getByRole('button', { name: '배치 시작' }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  await clickWorld(0, 0);
  await page.getByText('능력 범위 미리보기', { exact: true }).click();
  await page.getByLabel('능력', { exact: true }).selectOption('blink');
  await page.getByLabel('미리보기 형태', { exact: true }).selectOption('vector');
  await page.getByRole('button', { name: '범위 표시', exact: true }).click();
  await page.getByRole('button', { name: '지도에 배치', exact: true }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  await clickWorld(-9.5, -5);
  await expect(placed.getByRole('button', { name: 'Blink 표시 중' })).toBeVisible();
  const coordinates = placed.locator('dd').first();
  await expect(coordinates).toHaveText(/, 4, /);
  await page.getByRole('button', { name: '범위 숨기기', exact: true }).click();
  await placed.getByRole('button', { name: '능력 이동' }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  await clickWorld(-4, 0);
  await expect(coordinates).toHaveText(/, 0, /);
  await placed.getByRole('button', { name: '능력 45° 회전' }).click();
  await expect(placed.getByText('45°', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('ability-placement-2d.png') });
  await page.getByRole('button', { name: '3D 원근' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '3d');
  await expect(coordinates).toHaveText(/, 0, /);
  await expect(placed.getByText('45°', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('ability-placement-3d.png') });
  const visible = await canvas.screenshot();
  await placed.getByRole('button', { name: '능력 숨기기' }).click();
  await expect(placed.getByRole('button', { name: 'Blink 숨김' })).toBeVisible();
  await expect.poll(async () => (await canvas.screenshot()).equals(visible)).toBe(false);
  await placed.getByRole('button', { name: '능력 삭제' }).click();
  await expect(placed).toHaveCount(0);
  await page.getByRole('button', { name: '실행 취소', exact: true }).click();
  await expect(placed.getByRole('button', { name: 'Blink 숨김' })).toBeVisible();
});

test('preserves and edits a custom area duration across map views', async ({ page }, testInfo) => {
  await page.goto('/');
  const canvas = page.getByTestId('viewport').locator('canvas');
  const placed = page.getByRole('region', { name: '배치한 능력' });
  await page.getByRole('button', { name: '2D 탑다운' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  await page.getByRole('button', { name: '배치 시작' }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  await canvas.click();
  await page.getByText('능력 범위 미리보기', { exact: true }).click();
  await page.getByLabel('능력', { exact: true }).selectOption('blink');
  await page.getByLabel('미리보기 형태', { exact: true }).selectOption('area');
  await page.getByLabel('지속 시간 (초)', { exact: true }).fill('3.5');
  await page.getByRole('button', { name: '범위 표시', exact: true }).click();
  await expect(page.getByText('Blink · 5 u · 3.5초', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '지도에 배치' }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas has no bounds');
  const unitsPerPixel = Math.max(36 / box.width, 24 / box.height) * 1.22;
  await page.mouse.click(box.x + box.width / 2 - 4 / unitsPerPixel, box.y + box.height / 2);
  await expect(placed.getByText('3.5초', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '범위 숨기기' }).click();
  await placed.getByLabel('배치한 영역 지속 시간 (초)').fill('8');
  await placed.getByRole('button', { name: '지속 시간 적용' }).click();
  await expect(placed.getByText('8초', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '3D 원근' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '3d');
  await expect(placed.getByText('8초', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('ability-area-duration-3d.png') });
  await placed.getByLabel('배치한 영역 지속 시간 (초)').fill('');
  await placed.getByRole('button', { name: '지속 시간 적용' }).click();
  await expect(placed.getByText('미설정', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '실행 취소', exact: true }).click();
  await expect(placed.getByText('8초', { exact: true })).toBeVisible();
});

test('shows the source and status of a game distance reference separately from map units', async ({ page }, testInfo) => {
  await page.goto('/');
  const canvas = page.getByTestId('viewport').locator('canvas');
  const placed = page.getByRole('region', { name: '배치한 능력' });
  await page.getByRole('button', { name: '2D 탑다운' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  await page.getByRole('button', { name: '배치 시작' }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  await canvas.click();
  await page.getByText('능력 범위 미리보기', { exact: true }).click();
  await page.getByLabel('능력', { exact: true }).selectOption('blink');
  await page.getByRole('button', { name: '범위 표시', exact: true }).click();
  await page.getByRole('button', { name: '지도에 배치' }).click();
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas has no bounds');
  const unitsPerPixel = Math.max(36 / box.width, 24 / box.height) * 1.22;
  await page.mouse.click(box.x + box.width / 2 - 4 / unitsPerPixel, box.y + box.height / 2);

  await placed.getByText('게임 거리 참고값', { exact: true }).click();
  await placed.getByLabel('게임 거리 (m)', { exact: true }).fill('8.5');
  await placed.getByRole('textbox', { name: '게임 버전' }).fill('Test build');
  await placed.getByRole('textbox', { name: '출처' }).fill('Test reference notes');
  await placed.getByRole('button', { name: '참고값 저장' }).click();
  await expect(placed.getByText('사용자 추정 · 8.5 m', { exact: true })).toBeVisible();
  await expect(placed.getByText('사용자 설정 · 5 u', { exact: true })).toBeVisible();
  await placed.getByLabel('참고값 유형', { exact: true }).selectOption('measured');
  await placed.getByRole('button', { name: '참고값 저장' }).click();
  await page.getByRole('button', { name: '3D 원근' }).click();
  await expect(canvas).toHaveAttribute('data-view-mode', '3d');
  await expect(placed.getByText('사용자 실측 · 8.5 m', { exact: true })).toBeVisible();
  await expect(placed.getByRole('definition').filter({ hasText: 'Test reference notes' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('ability-range-reference-3d.png') });
  await placed.getByRole('button', { name: '참고값 지우기' }).click();
  await expect(placed.getByText('사용자 실측 · 8.5 m', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '실행 취소', exact: true }).click();
  await expect(placed.getByText('사용자 실측 · 8.5 m', { exact: true })).toBeVisible();

  const local = page.getByRole('region', { name: '로컬 전략' });
  await local.getByRole('button', { name: '전략 저장', exact: true }).click();
  await expect(local.getByRole('status')).toHaveText('이 브라우저에 전략을 저장했습니다.');
  await page.reload();
  await expect(placed).toHaveCount(0);
  await local.getByRole('button', { name: '저장본 확인' }).click();
  await local.getByRole('button', { name: '전략 복원' }).click();
  await expect(local.getByRole('status')).toHaveText('저장된 전략을 복원했습니다.');
  await placed.getByRole('button', { name: 'Blink 표시 중' }).click();
  await placed.getByText('게임 거리 참고값', { exact: true }).click();
  await expect(placed.getByText('사용자 실측 · 8.5 m', { exact: true })).toBeVisible();
  await expect(placed.getByText('Test reference notes', { exact: true })).toBeVisible();
  await placed.getByRole('button', { name: '능력 45° 회전' }).click();
  await expect(placed.getByText('45°', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('strategy-draft-restored.png') });
});

test('reports missing drafts and leaves the editor intact when storage is malformed', async ({ page }) => {
  await page.goto('/');
  const local = page.getByRole('region', { name: '로컬 전략' });
  await local.getByRole('button', { name: '저장본 확인' }).click();
  await expect(local.getByRole('status')).toHaveText('이 브라우저에 저장된 전략이 없습니다.');
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('vertactics-strategy', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('drafts', 'readwrite');
      transaction.objectStore('drafts').put({ version: 99 }, 'workspace');
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onabort = () => { database.close(); reject(transaction.error); };
    };
  }));
  await local.getByRole('button', { name: '저장본 확인' }).click();
  await expect(local.getByRole('status')).toHaveText('저장된 전략을 읽을 수 없습니다. 현재 편집을 계속할 수 있습니다.');
  await expect(local.getByRole('button', { name: '전략 복원' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '고저차 테스트 맵' })).toBeVisible();
});
