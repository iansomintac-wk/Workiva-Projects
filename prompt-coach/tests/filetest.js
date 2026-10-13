/* Real-file test: loads Word/Excel/PowerPoint/PDF/CSV fixtures into dist/prompt-coach.html in Chromium,
   serving the page's CDN libraries from a local npm install (same versions). Run: python3 tests/make_fixtures.py && VENDOR=... node tests/filetest.js */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
// VENDOR: a folder where mammoth@1.6.0 xlsx@0.18.5 jszip@3.10.1 pdfjs-dist@3.11.174 are npm-installed
const V = (process.env.VENDOR || __dirname + '/vendor') + '/node_modules/';
const MAP = {
  'mammoth/1.6.0/mammoth.browser.min.js': 'mammoth/mammoth.browser.min.js',
  'xlsx/0.18.5/xlsx.full.min.js': 'xlsx/dist/xlsx.full.min.js',
  'jszip/3.10.1/jszip.min.js': 'jszip/dist/jszip.min.js',
  'pdf.js/3.11.174/pdf.min.js': 'pdfjs-dist/build/pdf.min.js',
  'pdf.js/3.11.174/pdf.worker.min.js': 'pdfjs-dist/build/pdf.worker.min.js'
};
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  const served = [];
  await p.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/(.*)$/, (r) => {
    const key = r.request().url().split('/ajax/libs/')[1]; const f = MAP[key];
    if (!f) { served.push('MISSING ' + key); return r.abort(); }
    served.push(key); return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(V + f) });
  });
  await p.goto('file://' + path.join(__dirname, '../dist/prompt-coach.html')); await p.waitForTimeout(500);
  const dir = __dirname + '/fixtures/';
  const names = ['Q3 Flux.xlsx', 'RCM_FY26.xlsx', 'Access Policy.docx', 'Board Deck Q3.pptx', 'GHG Inventory 2025.pdf', 'Supplier Data.csv', 'Scanned Invoice.pdf', 'Access Policy.doc'];
  await p.setInputFiles('#fileInput', names.map((n) => dir + n));
  await p.waitForFunction(() => ![...document.querySelectorAll('.file .meta')].some((m) => m.textContent === 'Reading…'), null, { timeout: 30000 });
  const rows = await p.$$eval('.file', (els) => els.map((e) => e.querySelector('.name').childNodes[0].textContent + ' → ' + e.querySelector('.meta').textContent));
  rows.forEach((r) => console.log('  ' + r));
  // remove the error files so rewrites use the good ones
  for (const bad of ['Scanned Invoice.pdf', 'Access Policy.doc', 'RCM_FY26.xlsx', 'Access Policy.docx', 'Board Deck Q3.pptx', 'GHG Inventory 2025.pdf', 'Supplier Data.csv']) await p.click(`button[aria-label="Remove ${bad}"]`);
  await p.locator('#prompt').fill('look at revenue for Q4 FY26'); await p.waitForTimeout(400);
  await p.locator('#tab-strong').click();
  console.log('\nSTRONG with Q3 Flux.xlsx:', await p.locator('#stagePrompt').innerText());
  console.log('NOTES:', (await p.locator('#notes').innerText()).replace(/\n+/g, ' | '));
  await p.locator('.chip.off').first().click().catch(() => {});
  console.log('FIX:', (await p.locator('#fix').innerText()).replace(/\n+/g, ' | ').slice(0, 300));
  console.log('\nlibraries served:', served.join(', '));
  console.log('errors:', errs);
  await b.close();
})();
