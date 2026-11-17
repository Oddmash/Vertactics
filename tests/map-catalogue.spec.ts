import { expect, test } from '@playwright/test';

test('lists the OWKR map pool and opens the available terrain through its existing ID', async ({ page }) => {
  await page.goto('./');
  const open = page.getByRole('button', { name: '전장 목록' });
  await open.click();
  const library = page.getByRole('dialog', { name: '전장 목록' });
  await expect(library.getByRole('listitem')).toHaveCount(31);
  await expect(library.getByText('지형 준비 중', { exact: true })).toHaveCount(30);
  await expect(library.getByText('네온 정션', { exact: true })).toBeVisible();
  await expect(library.getByText('감시 기지: 그림스뵈튼', { exact: true })).toBeVisible();
  await library.getByRole('button', { name: '왕의 길 열기' }).click();
  await expect(library).toBeHidden();
  await expect(page.getByRole('combobox', { name: '지도', exact: true })).toHaveValue('kings-row-a');
  await expect(page.getByRole('heading', { name: '왕의 길 A 거점 (근사 지도)' })).toBeVisible();
  await expect(page.getByTestId('viewport').locator('canvas')).toBeVisible();

  await page.getByRole('combobox', { name: '언어' }).selectOption('en');
  const englishOpen = page.getByRole('button', { name: 'Map catalogue' });
  await englishOpen.click();
  const englishLibrary = page.getByRole('dialog', { name: 'Map catalogue' });
  await expect(englishLibrary.getByRole('button', { name: 'Open King’s Row' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(englishLibrary).toBeHidden();
  await expect(englishOpen).toBeFocused();
});
