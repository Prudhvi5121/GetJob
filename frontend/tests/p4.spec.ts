import { test, expect } from '@playwright/test';

async function resetClientState(page: any) {
  await page.goto('/jobs');
  await page.evaluate(() => {
    localStorage.removeItem('getjob.savedJobs');
    localStorage.removeItem('getjob.theme');
  });
  await page.reload();
}

test.describe('P4 verification', () => {
  test('save, unsave, saved page, and persistence after refresh', async ({ page }) => {
    await resetClientState(page);
    const firstCard = page.locator('.job-item').first();
    await firstCard.waitFor({ state: 'visible', timeout: 10000 });
    const title = (await firstCard.locator('.card-title-group a').textContent())?.trim();
    const saveButton = firstCard.locator('button.save-job');

    await expect(saveButton).toHaveAttribute('aria-pressed', 'false');
    await saveButton.click();
    await expect(saveButton).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('link', { name: 'Saved Jobs' }).click();
    await expect(page.locator('h2')).toHaveText('Saved Jobs');
    await expect(page.locator('.job-item').first().locator('.card-title-group a')).toHaveText(title || '');

    await page.reload();
    await expect(page.locator('.job-item').first().locator('.card-title-group a')).toHaveText(title || '');

    await page.locator('.job-item').first().locator('button.save-job').click();
    await expect(page.getByText('No saved jobs yet')).toBeVisible();
  });

  test('saved jobs empty state links back to real jobs', async ({ page }) => {
    await resetClientState(page);
    await page.goto('/saved');
    await expect(page.getByText('No saved jobs yet')).toBeVisible();
    await expect(page.getByText('Save jobs you want to come back to later.')).toBeVisible();
    await page.getByRole('link', { name: 'Browse Jobs' }).click();
    await expect(page).toHaveURL(/\/jobs$/);
  });

  test('theme toggle persists across refresh', async ({ page }) => {
    await resetClientState(page);
    const toggle = page.locator('button.theme-toggle');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(page.locator('.app-root')).toHaveClass(/theme-dark/);
    await page.reload();
    await expect(page.locator('.app-root')).toHaveClass(/theme-dark/);
    await toggle.click();
    await expect(page.locator('.app-root')).not.toHaveClass(/theme-dark/);
  });

  test('freshness indicator uses the real ingestion health endpoints', async ({ page }) => {
    await resetClientState(page);
    const healthResponse = await page.request.get('/api/health');
    const runsResponse = await page.request.get('/api/ingestion/runs?per_page=50');
    expect(healthResponse.ok()).toBeTruthy();
    expect(runsResponse.ok()).toBeTruthy();
    await page.goto('/jobs');
    const indicator = page.locator('.freshness-indicator');
    await expect(indicator).toBeVisible({ timeout: 10000 });
    await expect(indicator).toContainText(/Updated recently|Data may be outdated|Freshness unavailable/);
  });
});
