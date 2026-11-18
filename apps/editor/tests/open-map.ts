import type { Page } from '@playwright/test';

export const openMap = async (page: Page, name: string) => {
  await page.getByRole('button', { name: '전장 변경', exact: true }).click();
  await page.getByRole('dialog', { name: '전장 변경' }).getByRole('button', { name, exact: true }).click();
};
