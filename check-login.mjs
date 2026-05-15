import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const logs = [];
const errors = [];
page.on('console', msg => logs.push(`${msg.type()}: ${msg.text()}`));
page.on('pageerror', err => errors.push(String(err)));

const response = await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(1200);

const hasLoginCard = await page.locator('.login-card').count();
const textBody = await page.locator('body').innerText();
await page.screenshot({ path: '/tmp/login-check.png', fullPage: true });

console.log('status', response?.status());
console.log('url', page.url());
console.log('hasLoginCard', hasLoginCard);
console.log('bodyPreview', JSON.stringify(textBody.slice(0, 220)));
console.log('errors', JSON.stringify(errors, null, 2));
console.log('logs', JSON.stringify(logs.slice(-30), null, 2));

await browser.close();
