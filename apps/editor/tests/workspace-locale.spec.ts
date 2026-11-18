import { clickWestHighGround } from './workspace-map';
import { expect, test } from '@playwright/test';

test('switches language without clearing selection and restores a save in English', async ({ page }) => {
  await page.goto('./');
  const publicMap = Boolean(process.env.VERTACTICS_PUBLIC_URL);
  if (publicMap) {
    const canvas = page.getByTestId('viewport').locator('canvas');
    await expect(canvas).toHaveAttribute('data-view-mode', '2d');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Missing map bounds');
    const units = Math.max(40 / box.width, 46 / box.height) * 1.22;
    await expect(async () => {
      await canvas.click({ position: { x: box.width / 2 + 10 / units, y: box.height / 2 + 3 / units } });
      await expect(page.getByRole('heading', { name: '공격 측 고지대', exact: true })).toBeVisible({ timeout: 500 });
    }).toPass({ timeout: 5000 });
  } else {
    await clickWestHighGround(page);
  }
  await page.getByRole('combobox', { name: '언어' }).selectOption('en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: publicMap ? 'King’s Row Point A (schematic)' : 'Elevation Lab' })).toBeVisible();
  await expect(page.getByRole('heading', { name: publicMap ? 'Attacker high ground' : 'West high ground', exact: true })).toBeVisible();

  await page.getByRole('button', { name: '2D top-down' }).click();
  await expect(page.getByRole('complementary', { name: 'Terrain details' }).getByText('+4 u')).toBeVisible();
  const roster = page.getByRole('group', { name: 'Choose a hero' });
  await page.getByRole('group', { name: 'Hero role' }).getByRole('button', { name: 'Tank', exact: true }).click();
  await expect(roster.getByRole('button', { name: 'Reinhardt', exact: true })).toBeVisible();

  const local = page.getByRole('region', { name: 'Local strategies' });
  await local.getByLabel('Strategy name').fill('Bus approach');
  await local.getByRole('button', { name: 'Save strategy', exact: true }).click();
  await expect(local.getByRole('status')).toHaveText('Saved the strategy in this browser.');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await local.getByRole('button', { name: 'Show saved strategies' }).click();
  const saved = local.getByRole('button', { name: /Bus approach/ });
  const time = saved.locator('time');
  await expect(time).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}T/);
  await expect.poll(() => time.evaluate((element: HTMLTimeElement) => new Intl.DateTimeFormat('en', {
    dateStyle: 'medium', timeStyle: 'short',
  }).format(new Date(element.dateTime)) === element.textContent)).toBe(true);
  await saved.click();
  await local.getByRole('button', { name: 'Restore strategy' }).click();
  await expect(local.getByRole('status')).toHaveText('Restored the saved strategy.');

  await page.getByRole('combobox', { name: 'Language' }).selectOption('ko');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expect(page.getByRole('heading', { name: publicMap ? '왕의 길 A 거점 (근사 지도)' : '고저차 테스트 맵' })).toBeVisible();
});
