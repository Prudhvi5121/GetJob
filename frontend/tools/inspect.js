const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('[console]', msg.type(), msg.text()));
  page.on('pageerror', e => console.log('[pageerror]', e.toString()));
  page.on('requestfailed', r => console.log('[reqfailed]', r.url(), r.failure()?.errorText));
  await page.goto('http://127.0.0.1:4200', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const content = await page.content();
  console.log('--- PAGE HTML ---');
  console.log(content.substring(0, 2000));
  await browser.close();
})();
