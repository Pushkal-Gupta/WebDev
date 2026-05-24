// Playwright smoke for the Pyodide interactive Playground path.
// Assumes the dev server (npm run dev) is already running on the standard port,
// or accepts a BASE_URL env var pointing at a preview.
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const SCREENSHOT_PATH = process.env.SCREENSHOT_PATH || '/tmp/pgcode-pyodide-interactive.png';

const CODE = `print("Hello, PGcode!")
print("Enter input : ", end="")
n = int(input())
print(n * 2)
`;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  page.on('console', (msg) => {
    console.log(`[browser:${msg.type()}]`, msg.text());
  });
  page.on('pageerror', (err) => console.error('[pageerror]', err.message));
  page.on('requestfailed', (req) => console.error('[requestfailed]', req.url(), req.failure()?.errorText));

  console.log('NAV', `${BASE_URL}/#/playground`);
  await page.goto(`${BASE_URL}/#/playground`, { waitUntil: 'domcontentloaded' });

  // Wait for the playground to mount.
  await page.waitForSelector('.pg-playground', { timeout: 20000 });

  // Switch to Terminal mode.
  const terminalBtn = page.locator('.pg-pg-segment-btn', { hasText: /Terminal/i });
  await terminalBtn.click();

  // Replace editor content with the test program by using the Monaco model.
  await page.waitForSelector('.monaco-editor', { timeout: 15000 });
  await page.evaluate((newCode) => {
    const ed = window.monaco?.editor?.getEditors?.()[0]
      || (window.monaco?.editor?.getModels?.()[0] && window.monaco.editor);
    if (window.monaco?.editor?.getModels?.().length) {
      const model = window.monaco.editor.getModels()[0];
      model.setValue(newCode);
      return;
    }
    if (ed?.setValue) ed.setValue(newCode);
  }, CODE);

  // Click Run.
  await page.locator('.pg-pg-btn-primary', { hasText: /Run/i }).click();

  // Probe: confirm .pg-pg-terminal-live mounted at all (else interactive path didn't fire).
  await page.waitForSelector('.pg-pg-terminal-live', { timeout: 15000 });
  console.log('mounted .pg-pg-terminal-live');

  // First-time pyodide download can take a while - wait up to 120s, log progress.
  const start = Date.now();
  let lastText = '';
  while (Date.now() - start < 120000) {
    const t = await page.locator('.pg-pg-terminal-live').innerText().catch(() => '');
    if (t !== lastText) {
      console.log(`[t=${Math.round((Date.now()-start)/1000)}s] transcript:`, JSON.stringify(t));
      lastText = t;
    }
    if (t.includes('Enter input :')) break;
    await page.waitForTimeout(750);
  }
  if (!lastText.includes('Enter input :')) {
    await page.screenshot({ path: SCREENSHOT_PATH + '.fail.png' });
    throw new Error('Timeout waiting for Enter input prompt. See ' + SCREENSHOT_PATH + '.fail.png');
  }

  const transcriptBefore = await page.locator('.pg-pg-terminal-live').innerText();
  console.log('--- transcript before input ---');
  console.log(transcriptBefore);

  if (!transcriptBefore.includes('Hello, PGcode!')) throw new Error('FAIL: missing "Hello, PGcode!"');
  if (!transcriptBefore.includes('Enter input :')) throw new Error('FAIL: missing "Enter input :"');

  // The inline input should be present and focused.
  await page.waitForSelector('.pg-pg-terminal-input-inline', { timeout: 5000 });
  const focused = await page.evaluate(() => document.activeElement?.classList?.contains('pg-pg-terminal-input-inline'));
  if (!focused) throw new Error('FAIL: inline input not focused');

  // Type 5 and submit with Enter.
  await page.keyboard.type('5');
  await page.keyboard.press('Enter');

  await page.waitForFunction(() => {
    const el = document.querySelector('.pg-pg-terminal-live');
    return el && /(^|\n)10(\n|$)/.test(el.textContent);
  }, null, { timeout: 30000 });

  const transcriptAfter = await page.locator('.pg-pg-terminal-live').innerText();
  console.log('--- transcript after input ---');
  console.log(transcriptAfter);

  if (!/(^|\n)10(\n|$)/.test(transcriptAfter)) throw new Error('FAIL: expected "10" in output');

  await page.screenshot({ path: SCREENSHOT_PATH, fullPage: false });
  console.log('SCREENSHOT', SCREENSHOT_PATH);
  console.log('PASS');

  await browser.close();
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
