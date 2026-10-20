/* node research/2026-10-20-quote-line-capture.js : screenshots the "Your prompt" panel of dist/prompt-coach.html for two prompts.
   Writes ../docs/evidence/2026-10-20-prompt-coach-quote-line/{quote,exclusion}.png and prints "name sha256 headline-text". No npm deps (CDP like tests/pagetest.js). */
const { spawn } = require('child_process'), fs = require('fs'), os = require('os'), path = require('path'), net = require('net'), crypto = require('crypto');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PAGE = require('url').pathToFileURL(path.resolve(__dirname, '../dist/prompt-coach.html')).href;
const OUT = path.resolve(__dirname, '../../docs/evidence/2026-10-20-prompt-coach-quote-line');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const freePort = () => new Promise((res) => { const s = net.createServer().listen(0, () => { const p = s.address().port; s.close(() => res(p)); }); });
const CASES = [{ name: 'quote', prompt: 'help with the 10-K' }, { name: 'exclusion', prompt: 'Evaluate: carefully' }];

async function main() {
  const port = await freePort(), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-chrome-'));
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + port, '--user-data-dir=' + dir, '--no-first-run', '--disable-gpu', 'about:blank'], { stdio: 'ignore' });
  try {
    let tgt;
    for (let i = 0; i < 60 && !tgt; i++) { try { tgt = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch (e) { await sleep(250); } }
    if (!tgt) throw new Error('Chrome did not start');
    const ws = new WebSocket(tgt.webSocketDebuggerUrl); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    let id = 0; const pend = new Map();
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
    const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'eval failed'); return r.result.result.value; };
    await send('Runtime.enable'); await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: PAGE }); await sleep(1500);
    fs.mkdirSync(OUT, { recursive: true });
    for (const c of CASES) {
      const r = await ev(`(async () => { const e = document.getElementById('prompt'); e.value = ${JSON.stringify(c.prompt)}; e.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise((r) => setTimeout(r, 700));
        const h = document.getElementById('headline'), l = document.getElementById('yourLabel'); let a = h; while (a && !a.contains(l)) a = a.parentElement;
        a.scrollIntoView({ block: 'start' }); await new Promise((r) => setTimeout(r, 200));
        const b = a.getBoundingClientRect(); return { x: b.x + scrollX, y: b.y + scrollY, width: b.width, height: b.height, text: h.textContent }; })()`);
      const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: r.x, y: r.y, width: r.width, height: r.height, scale: 1 } });
      const buf = Buffer.from(shot.result.data, 'base64');
      fs.writeFileSync(path.join(OUT, c.name + '.png'), buf);
      console.log(c.name, crypto.createHash('sha256').update(buf).digest('hex'), r.text);
    }
  } finally { chrome.kill(); }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
