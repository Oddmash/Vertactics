import { expect, test } from '@playwright/test';

test('opens the whole-map view and jumps between locations on the same 2D canvas', async ({ page }) => {
  await page.goto('./');
  const open = page.getByRole('button', { name: '전장 목록' });
  await open.click();
  const library = page.getByRole('dialog', { name: '전장 목록' });
  await expect(library.getByRole('listitem')).toHaveCount(31);
  await expect(library.getByRole('button', { name: / 열기$/ })).toHaveCount(31);
  await expect(library.getByText('네온 정션', { exact: true })).toBeVisible();
  await expect(library.getByText('감시 기지: 그림스뵈튼', { exact: true })).toBeVisible();
  await library.getByRole('button', { name: '왕의 길 열기' }).click();
  await expect(library).toBeHidden();
  const map = page.getByRole('combobox', { name: '지도', exact: true });
  await expect(map).toHaveValue('kings-row');
  await expect(page.getByRole('heading', { name: '왕의 길', exact: true })).toBeVisible();
  const canvas = page.getByTestId('viewport').locator('canvas');
  await expect(canvas).toHaveAttribute('data-view-mode', '2d');
  await expect(page.getByRole('button', { name: '3D 원근' })).toHaveCount(0);
  const locations = page.getByRole('combobox', { name: '주요 위치' });
  const wholeMap = await canvas.screenshot();
  await locations.selectOption({ label: 'A 점령 거점' });
  await expect.poll(async () => (await canvas.screenshot()).equals(wholeMap)).toBe(false);
  await expect(map).toHaveValue('kings-row');
  await locations.selectOption({ label: '전장 전체' });
  await expect.poll(async () => (await canvas.screenshot()).equals(wholeMap)).toBe(true);

  await map.selectOption('busan');
  await expect(locations.getByRole('option', { name: '메카 기지' })).toHaveCount(1);
  await expect(locations).toHaveValue('');

  await page.getByRole('combobox', { name: '언어' }).selectOption('en');
  const englishOpen = page.getByRole('button', { name: 'Map catalogue' });
  await englishOpen.click();
  const englishLibrary = page.getByRole('dialog', { name: 'Map catalogue' });
  await expect(englishLibrary.getByRole('button', { name: 'Open King’s Row' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(englishLibrary).toBeHidden();
  await expect(englishOpen).toBeFocused();
});
