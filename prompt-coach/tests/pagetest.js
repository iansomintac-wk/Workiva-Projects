/* Browser test for dist/prompt-coach.html. No npm deps: spawns Chrome and drives it over CDP with Node's WebSocket.
   node tests/pagetest.js   exits 1 on any failure. */
const { spawn } = require('child_process'), fs = require('fs'), os = require('os'), path = require('path'), net = require('net');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PAGE = require('url').pathToFileURL(path.resolve(__dirname, '../dist/prompt-coach.html')).href;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const freePort = () => new Promise((res) => { const s = net.createServer().listen(0, () => { const p = s.address().port; s.close(() => res(p)); }); });
const NOTE = {
  calc: 'Workiva AI can get figures wrong',
  personal: 'seems to include personal or account details',
  offtopic: 'does not look like a Workiva task',
  stacked: 'asking for several things at once'
};
const HAIKU = 'Use only the observations below. Write a haiku for my niece, as three lines. Flag anything you cannot verify';
const STACK = 'Summarize the report, list the risks, draft an email, and compare to last year';
const PLAIN = 'Use only @RCM_FY26.xlsx. Summarize the failed controls for the audit committee in five bullets. Flag anything you cannot verify.';

async function main() {
  const port = await freePort(), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-chrome-'));
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + port, '--user-data-dir=' + dir, '--no-first-run', '--disable-gpu', 'about:blank'], { stdio: 'ignore' });
  const fails = []; let checks = 0;
  const check = (name, ok, extra) => { checks++; if (!ok) fails.push(name + (extra ? ' [' + extra + ']' : '')); };
  try {
    let tgt;
    for (let i = 0; i < 60 && !tgt; i++) { try { tgt = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch (e) { await sleep(250); } }
    if (!tgt) throw new Error('Chrome did not start');
    const ws = new WebSocket(tgt.webSocketDebuggerUrl); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    let id = 0; const pend = new Map(), errors = [];
    ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
      else if (d.method === 'Runtime.exceptionThrown') errors.push('exception: ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text));
      else if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push('console.error: ' + d.params.args.map((a) => a.value || a.description).join(' '));
      else if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error' && !/fonts\.(googleapis|gstatic)|cdn|ERR_INTERNET|ERR_NAME|ERR_FAILED/.test(d.params.entry.url + d.params.entry.text)) errors.push('log error: ' + d.params.entry.text);
    };
    const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'eval failed'); return r.result.result.value; };
    await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: PAGE }); await sleep(1500);
    // type a prompt, wait for the page to grade it, read what it shows
    const type = (v) => ev(`(async () => { const e = document.getElementById('prompt'); e.value = ${JSON.stringify(v)}; e.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 700));
      const tabs = [...document.querySelectorAll('#stageTabs button')].map((b) => b.id.replace('tab-', ''));
      const strong = document.getElementById('tab-strong'); if (strong) strong.click();
      const stage = document.getElementById('stagePanel').hidden ? '' : document.getElementById('stagePrompt').textContent;
      const mine = document.getElementById('tab-mine'); if (mine) mine.click();
      return { notes: document.getElementById('notes').textContent, headline: document.getElementById('headline').textContent, label: document.getElementById('yourLabel').textContent, grade: (document.querySelector('#tab-mine small') || {}).textContent, tabs, stage }; })()`);
    const has = (r, k) => r.notes.includes(NOTE[k]);
    let r = await type('Calculate the total revenue from the attached report');
    check('calc input shows the calc note', has(r, 'calc'), r.notes.slice(0, 80));
    r = await type("Jane Doe's salary is $92,000 in the payroll report");
    check('personal input shows the personal note', has(r, 'personal'), r.notes.slice(0, 80));
    r = await type('SSN 123456789 for the employee table');
    check('personal (SSN, no dashes) shows the personal note', has(r, 'personal'), r.notes.slice(0, 80));
    r = await type('Write a poem about cats');
    check('offtopic input shows the offtopic note', has(r, 'offtopic'), r.notes.slice(0, 80));
    r = await type(STACK);
    check('stacked input shows the stacked note', has(r, 'stacked'), r.notes.slice(0, 80));
    r = await type(HAIKU);
    check('haiku: displayed grade is not strong', r.grade !== 'strong' && r.label !== 'why it’s strong', r.grade + '/' + r.label);
    check('haiku: no "All five SCOPE elements" text', !/All five SCOPE elements/.test(r.headline + r.notes), r.headline.slice(0, 60));
    check('haiku: no stacked text', !/several things at once/.test(r.headline + r.notes), (r.headline + r.notes).slice(0, 80));
    check('haiku: shows the offtopic note', has(r, 'offtopic'), r.notes.slice(0, 80));
    check('haiku: no polished rewrite stages', r.tabs.length === 1 && r.stage === '', r.tabs.join(',') + ' ' + r.stage.slice(0, 40));
    r = await type(PLAIN);
    check('plain work prompt shows none of the new notes', !['calc', 'personal', 'offtopic', 'stacked'].some((k) => has(r, k)), r.notes.slice(0, 80));
    r = await type('help with the 10-K');
    check('quote line: "help with the 10-K" headline quotes the ask', r.headline.includes('The coach read your ask as "help with the 10-K"'), r.headline.slice(0, 160));
    r = await type('Evaluate: carefully');
    check('quote line: "Evaluate:" label headline has no quote', !r.headline.includes('The coach read your ask'), r.headline.slice(0, 160));
    r = await type('the 10-K needs a quick look, can you help');
    check('quote line: no sentence-opening vague verb, headline has no quote', !r.headline.includes('The coach read your ask'), r.headline.slice(0, 160));
    check('no console errors', errors.length === 0, errors.join(' | ').slice(0, 200));
    ws.close();
  } finally { chrome.kill(); }
  console.log(fails.length ? fails.map((f) => 'FAIL ' + f).join('\n') : '');
  console.log(`pagetest: ${checks} checks, ${fails.length} failed`);
  process.exit(fails.length ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
