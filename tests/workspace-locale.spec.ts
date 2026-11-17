import { expect, test } from '@playwright/test';

test('switches language without clearing selection and restores a save in English', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '서쪽 고지대 +4 u' }).click();
  await page.getByRole('combobox', { name: '언어' }).selectOption('en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'Elevation Lab' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'West high ground +4 u' })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: '2D top-down' }).click();
  await expect(page.getByRole('complementary', { name: 'Terrain details' }).getByText('+4 u')).toBeVisible();
  await expect(page.getByRole('option', { name: 'Reinhardt' })).toBeAttached();

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
  await expect(page.getByRole('heading', { name: '고저차 테스트 맵' })).toBeVisible();
});
