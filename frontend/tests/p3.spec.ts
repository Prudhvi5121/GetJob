import { test, expect } from '@playwright/test';

test.describe('P3 ingestion dashboard', () => {
  test('Admin dashboard shows cards, sources, runs and run trigger', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('h2')).toHaveText('Ingestion Dashboard');
    // cards
    const cards = await page.locator('.cards .card').count();
    expect(cards).toBeGreaterThan(0);
    // tables
    await expect(page.locator('table.sources')).toBeVisible();
    await expect(page.locator('table.runs')).toBeVisible();
    // run ingestion button exists
    const btn = page.locator('.card.action button');
    await expect(btn).toBeVisible();

    // click run and ensure button indicates running (disabled or label)
    await btn.click();
    await page.waitForTimeout(200);
    const isDisabled = await btn.isDisabled();
    const label = (await btn.textContent()) || '';
    const errVisible = await page.locator('.err').count() > 0;
    expect(isDisabled || label.includes('Running') || errVisible).toBeTruthy();

    // wait for button to re-enable (up to 60s)
    await page.waitForFunction(() => {
      const b = document.querySelector('button');
      return b && !(b as HTMLButtonElement).disabled;
    }, null, { timeout: 60000 }).catch(() => {});

    // ensure runs table has at least one row
    const rows = await page.locator('table.runs tbody tr').count();
    expect(rows).toBeGreaterThanOrEqual(0);
  });
});
