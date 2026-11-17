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
});
