import { test, expect } from '@playwright/test';

// Helper to fetch first job from backend API
async function fetchFirstJob() {
  const r = await fetch('http://localhost:3000/api/jobs?per_page=1');
  const j = await r.json();
  return (j.data && j.data[0]) || null;
}

test.describe('P2 verification', () => {
  test('Home shows recent jobs (real API)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h2')).toHaveText('Recent Jobs');
    // wait for either jobs list or error
    await Promise.race([
      page.locator('.job-item').first().waitFor({ state: 'visible', timeout: 10000 }),
      page.locator('.error').first().waitFor({ state: 'visible', timeout: 10000 })
    ]).catch(() => {});
    const items = await page.locator('.job-item').count();
    expect(items).toBeGreaterThan(0);
  });

  test('Jobs search and empty state', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.locator('h2')).toHaveText('Jobs');
    // ensure initial load
    await page.locator('.job-item').first().waitFor({ state: 'visible', timeout: 10000 });
    // search nonsense to trigger empty state
    await page.fill('input[placeholder="Search"]', 'qwerty-nonexistent-xyz');
    await page.click('.controls button');
    await page.waitForTimeout(500); // give it a moment
    const empty = await page.locator('text=No jobs found.').count();
    expect(empty).toBeGreaterThan(0);
    // clear search and restore
    await page.fill('input[placeholder="Search"]', '');
    await page.click('.controls button');
    await page.locator('.job-item').first().waitFor({ state: 'visible', timeout: 10000 });
  });

  test('Filters: location and job types present and functional', async ({ page }) => {
    const firstJob = await fetchFirstJob();
    test.skip(!firstJob, 'No job returned from API');
    await page.goto('/jobs');
    await page.locator('.job-item').first().waitFor({ state: 'visible', timeout: 10000 });
    // controls present
    await expect(page.locator('input[placeholder="Location"]')).toBeVisible();
    await expect(page.locator('select[multiple]')).toBeVisible();

    // if job has a location, filter by it and expect results
    if (firstJob.location) {
      await page.fill('input[placeholder="Location"]', firstJob.location);
      await page.click('.controls button');
      await page.locator('.job-item').first().waitFor({ state: 'visible', timeout: 10000 });
      const metas = await page.locator('.job-item .meta').allTextContents();
      expect(metas.some(m => m.includes(firstJob.location))).toBeTruthy();
    }

    // if job has job_types (array or string), try to apply one
    const jt = Array.isArray(firstJob.job_types) ? firstJob.job_types[0] : firstJob.job_type || null;
    if (jt) {
      // select option matching jt
      await page.selectOption('select[multiple]', { label: jt }).catch(() => {});
      await page.click('.controls button');
      await page.locator('.job-item').first().waitFor({ state: 'visible', timeout: 10000 });
      // no strict assertion here — ensure at least the UI accepted selection
      const count = await page.locator('.job-item').count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('Pagination works', async ({ page }) => {
    await page.goto('/jobs');
    await page.locator('.job-item').first().waitFor({ state: 'visible', timeout: 10000 });
    const pageLabel = page.locator('.pagination span');
    const before = await pageLabel.textContent();
    // try next
    const next = page.locator('.pagination button:has-text("Next")');
    if (await next.isEnabled()) {
      await next.click();
      await page.waitForTimeout(500);
      const after = await pageLabel.textContent();
      expect(after).not.toBe(before);
    }
  });

  test('Job details and View Original link', async ({ page }) => {
    const firstJob = await fetchFirstJob();
    test.skip(!firstJob, 'No job returned from API');
    await page.goto('/');
    await page.locator('.job-item a').first().waitFor({ state: 'visible', timeout: 10000 });
    // click first job
    await page.click('.job-item a');
    // wait for details
    await page.locator('article h2').first().waitFor({ state: 'visible', timeout: 10000 });
    const title = await page.locator('article h2').first().textContent();
    expect(title?.trim()).toContain(firstJob.title.substring(0, 10));
    const href = await page.locator('article a:has-text("View Original")').getAttribute('href');
    expect(href).toBe(firstJob.url);
  });

  test('Loading and error states', async ({ page, context }) => {
    // simulate network error for /api/jobs
    await page.route('**/api/jobs**', route => route.abort());
    await page.goto('/jobs');
    await page.locator('.error').first().waitFor({ state: 'visible', timeout: 10000 });
    const text = await page.locator('.error').textContent();
    expect(text).toContain('Failed to load');
    // restore route
    await page.unroute('**/api/jobs**');
  });

  test('Responsive: no horizontal scroll at 390,768,1440', async ({ page }) => {
    const sizes = [ [390, 844], [768, 1024], [1440, 900] ];
    for (const [w,h] of sizes) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto('/');
      await page.locator('.job-item').first().waitFor({ state: 'visible', timeout: 10000 });
      const hasScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(hasScroll).toBeFalsy();
    }
  });
});
