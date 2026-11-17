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

test('places and moves a hero across views, then undoes and redoes elevation changes', async ({ page }) => {
  page.on('pageerror', (error) => console.error(error.message));
  await page.goto('/');
  const twoD = page.getByRole('button', { name: '2D 탑다운' });
  const threeD = page.getByRole('button', { name: '3D 원근' });
  const canvas = page.getByTestId('viewport').locator('canvas');
  const inspector = page.getByRole('complementary', { name: '지형 정보' });
  await expect(canvas).toBeVisible();
  await twoD.click();

  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas has no bounds');
  const unitsPerPixel = Math.max(36 / box.width, 24 / box.height) * 1.22;
  const clickWorld = (x: number, z: number) => page.mouse.click(
    box.x + box.width / 2 + x / unitsPerPixel,
    box.y + box.height / 2 + z / unitsPerPixel,
  );

  await page.getByRole('button', { name: '배치 시작' }).click();
  await clickWorld(6, -8.6);
  await expect(page.getByText('배치할 지면을 클릭하세요.')).toBeVisible();
  await clickWorld(0, 0);
  await expect(inspector.getByText('트레이서')).toBeVisible();
  await expect(inspector.getByText('0 u', { exact: true })).toBeVisible();

  await inspector.getByRole('button', { name: '이동', exact: true }).click();
  await clickWorld(-9.5, -5);
  await expect(inspector.getByText('+4 u')).toBeVisible();
  await threeD.click();
  await expect(inspector.getByText('+4 u')).toBeVisible();

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
});
