/* Browser test for dist/fit-finder.html. No npm deps: spawns Chrome and drives it over CDP with Node's WebSocket.
   node tests/pagetest.js [capture-folder]   exits 1 on any failure. */
const { spawn } = require('child_process'), fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto'), net = require('net');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PAGE = 'file:///' + path.resolve(__dirname, '../dist/fit-finder.html').replace(/\\/g, '/');
const OUT = process.argv[2] || 'C:/Users/teasp/Downloads/fit-finder-improved/captures/';
const COACH = 'https://claude.ai/artifact/9Qk7uhNgri3uCSkUafsDQV';
const HOW = 'On 60 sample tasks written and labelled by AI it agreed 75% of the time; not yet measured on real tasks. Features come from 23 Workiva support pages read on 15 Oct 2026.';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const freePort = () => new Promise((res) => { const s = net.createServer().listen(0, () => { const p = s.address().port; s.close(() => res(p)); }); });

async function main() {
  const port = await freePort(), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ff-chrome-'));
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + port, '--user-data-dir=' + dir, '--no-first-run', '--disable-gpu', 'about:blank'], { stdio: 'ignore' });
  const fails = []; let checks = 0;
  const check = (w, name, ok, extra) => { checks++; if (!ok) fails.push(w + ' ' + name + (extra ? ' [' + extra + ']' : '')); };
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
      else if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error' && !/fonts\.(googleapis|gstatic)|ERR_INTERNET|ERR_NAME|ERR_FAILED/.test(d.params.entry.url + d.params.entry.text)) errors.push('log error: ' + d.params.entry.text);
    };
    const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'eval failed'); return r.result.result.value; };
    await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
    const page = `(() => { window.q = (s) => [...document.querySelectorAll(s)]; window.t = (s) => (document.querySelector(s) || {}).textContent || '';
      window.setTask = (v) => { const e = document.getElementById('task'); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); return new Promise((r) => setTimeout(r, 450)); }; return true; })()`;

    for (const [w, h, name] of [[1280, 900, '1280'], [375, 800, '375']]) {
      const before = fails.length, nerr = errors.length;
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
      await send('Page.navigate', { url: PAGE }); await sleep(1500);
      await ev(page);
      const W = name + 'px';
      // role chips
      const chips = await ev(`q('.role-chip').map((b) => b.textContent.trim())`);
      check(W, 'five role chips', chips.length === 5, 'found ' + chips.length);
      for (let i = 0; i < 5; i++) {
        const r = await ev(`(() => { q('.role-chip')[${i}]?.click(); const c = q('#wins .win'); return c.map((x) => ({ badge: !!x.querySelector('.avail') && x.querySelector('.avail').textContent.length > 0, btn: !!x.querySelector('button.try'), task: !!x.querySelector('.win-task') && x.querySelector('.win-task').textContent.length > 0, feat: !!x.querySelector('.win-feature') && x.querySelector('.win-feature').textContent.length > 0 })); })()`);
        check(W, `chip ${i} shows exactly 3 cards`, r.length === 3, 'found ' + r.length);
        check(W, `chip ${i} cards each have task, feature, badge, Try it`, r.length === 3 && r.every((c) => c.badge && c.btn && c.task && c.feat));
      }
      // Try it on role fr card 1
      const fr = await ev(`(async () => { const roles = FitCatalogue.roles; const frIdx = Object.keys(roles).indexOf('fr'); q('.role-chip')[frIdx]?.click(); const uc = FitCatalogue.useCases.find((u) => u.id === roles.fr.wins[0]); q('#wins .win')[0]?.querySelector('button.try')?.click(); await new Promise((r) => setTimeout(r, 300)); return { want: uc.try, got: document.getElementById('task').value, task: uc.task, where: t('#where h3') }; })()`);
      check(W, 'Try it fills the task box with the use case try text', fr.got === fr.want, JSON.stringify(fr.got).slice(0, 60));
      check(W, 'Try it result names that use case', fr.where === fr.task, JSON.stringify(fr.where).slice(0, 60));
      // fuller prompt panel
      const fuller = await ev(`(async () => { const u = FitCatalogue.useCases.find((x) => x.id === 'fr-yoy-narrative'); await setTask(u.try); const p = document.getElementById('fullerPanel'); return { shown: !!p && !p.hidden, head: p ? p.textContent : '', copy: !!(p && p.querySelector('button.copy')) }; })()`);
      check(W, 'fr-yoy-narrative try shows the fuller-prompt panel', fuller.shown);
      check(W, 'fuller-prompt panel heading', /or start from the fuller prompt for this use case/.test(fuller.head));
      check(W, 'fuller-prompt panel has a copy button', fuller.copy);
      const hid = await ev(`(async () => { await setTask("Every quarter I compare the MD&A to last year's and flag what changed."); const p = document.getElementById('fullerPanel'); return !p || p.hidden; })()`);
      check(W, 'MD&A compare sentence hides the fuller-prompt panel', hid);
      // tie-out: first try + preview badge
      const tie = await ev(`(async () => { const u = FitCatalogue.useCases.find((x) => x.id === 'fr-tie-out'); await setTask(u.try); const li = q('#firstTry li').map((x) => x.textContent); const f = document.getElementById('firstTry'); return { shown: !!f && !f.hidden, li, badge: q('#where .avail').map((x) => x.textContent), steps: FitCatalogue.surfaces['tie-out'].steps }; })()`);
      check(W, 'tie-out shows Your first try list', tie.shown && tie.li.length === tie.steps.length && tie.li.length > 0, 'li ' + tie.li.length);
      check(W, 'tie-out shows the preview badge', tie.badge.includes('preview: ask if it is on for you'), JSON.stringify(tie.badge));
      const noSteps = await ev(`(async () => { await setTask('Every month I chase site managers for their electricity data.'); const f = document.getElementById('firstTry'); return !f || f.hidden || q('#firstTry li').length === 0; })()`);
      check(W, 'first try hidden when there are no steps', noSteps);
      // badge exact texts
      const badges = await ev(`(() => { const out = new Set(); for (let i = 0; i < q('.role-chip').length; i++) { q('.role-chip')[i]?.click(); q('#wins .avail').forEach((a) => out.add(a.textContent)); } return [...out]; })()`);
      const okB = new Set(['included with Workiva AI', 'check your entitlement', 'preview: ask if it is on for you', 'not a named feature: try it on one file first']);
      check(W, 'badges use only the four exact texts', badges.length > 0 && badges.every((b) => okB.has(b)), JSON.stringify(badges));
      // rates text, coach link, banned phrase
      const how = await ev(`t('#howRates')`);
      check(W, 'How it rates text present', how.includes(HOW), JSON.stringify(how).slice(0, 80));
      const link = await ev(`(() => { const a = document.getElementById('coachLink'); return a ? { href: a.getAttribute('href'), target: a.target, rel: a.rel, text: a.textContent, para: a.parentElement.textContent } : null; })()`);
      check(W, 'Prompt Coach link href exact', !!link && link.href === COACH, link && link.href);
      check(W, 'Prompt Coach link opens safely in a new tab', !!link && link.target === '_blank' && /noopener/.test(link.rel) && link.text === 'Prompt Coach');
      check(W, 'paste-or-improve line under the starter prompt', !!link && link.para.includes('Paste it into Workiva AI chat, or improve it first in the Prompt Coach'));
      const banned = await ev(`/Workiva['\\u2019]s prompt/i.test(document.documentElement.textContent)`);
      check(W, 'no "Workiva\'s prompt" anywhere', !banned);
      // layout + capture
      await ev(`q('.role-chip')[0]?.click()`);
      const sw = await ev(`({ sw: document.documentElement.scrollWidth, iw: window.innerWidth })`);
      check(W, 'no horizontal scroll', sw.sw <= sw.iw, sw.sw + ' > ' + sw.iw);
      check(W, 'no console errors or exceptions', errors.length === nerr, errors.slice(nerr).join(' | ').slice(0, 200));
      const hgt = await ev('document.documentElement.scrollHeight');
      const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: hgt, scale: 1 } });
      fs.mkdirSync(OUT, { recursive: true });
      const f = path.join(OUT, 'fit-finder-' + name + '.png'), buf = Buffer.from(shot.result.data, 'base64'); fs.writeFileSync(f, buf);
      console.log(`${W}: ${fails.length - before} failed; ${f} ${buf.length} bytes sha1 ${crypto.createHash('sha1').update(buf).digest('hex')}`);
    }
    ws.close();
  } finally { chrome.kill(); }
  console.log(`${checks} checks, ${fails.length} failed`); fails.forEach((f) => console.log('FAIL ' + f));
  process.exit(fails.length ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
