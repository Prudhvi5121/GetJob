const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  page.on('console', msg => console.log('[console]', msg.type(), msg.text()));
  page.on('pageerror', e => console.log('[pageerror]', e.toString()));
  page.on('requestfailed', r => console.log('[reqfailed]', r.url(), r.failure()?.errorText));
  await page.goto('http://127.0.0.1:4300', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('Inner HTML length:', (await page.content()).length);
  await browser.close();
})();
