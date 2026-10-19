// Dev tooling (not part of the bundle): L12 legacy-book and date-persistence check on the working-tree 1.1. Synthetic data only.
// usage: node tools/l12-persist-check.mjs -> one L12-PERSIST line; exit 0 only if ok.
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inSim } from './l11-csat-panel.mjs';

const LEGACY = `(() => {
  try {
    const copy = JSON.parse(JSON.stringify(DATA));
    const before = copy.customers.map(c => { const a = (c.compliance || {}).associatedPeopleCSAT; return a ? JSON.stringify([a.done, a.date, a.contactName]) : null; });
    for (const c of copy.customers) { const a = (c.compliance || {}).associatedPeopleCSAT; if (a) { delete a.surveySentOn; delete a.surveyAnsweredOn; } }
    const out = prepareBookData(copy, 'Import');
    const book = (out && out.customers) ? out : copy;
    let n = 0, good = true;
    book.customers.forEach((c, i) => {
      const a = (c.compliance || {}).associatedPeopleCSAT; if (!a) return;
      n++;
      if (a.surveySentOn !== null || a.surveyAnsweredOn !== null || JSON.stringify([a.done, a.date, a.contactName]) !== before[i]) good = false;
    });
    return JSON.stringify({ ok: good && n > 0, n });
  } catch (e) { return JSON.stringify({ ok: false, err: String(e) }); }
})()`;

const ROUND = (attr, key, val) => `(() => {
  try {
    const c = DATA.customers.find(x => x.name === 'Orion' || /^Orion/.test(x.name));
    if (!c) return JSON.stringify({ ok: false, err: 'no Orion' });
    c.nextSessionScheduledOn = todayISO(); saveData(); ui.view = 'today'; ui.openCustomerId = null; ui.todayFocusId = c.id; render();
    const inp = document.querySelector('.day-pane[data-day-holds="' + c.id + '"] [${attr}="' + c.id + '"]');
    if (!inp) return JSON.stringify({ ok: false, err: 'no input' });
    inp.value = '${val}';
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    const out = prepareBookData(JSON.parse(localStorage.getItem(STORAGE_KEY)), 'Import');
    const book = (out && out.customers) ? out : JSON.parse(localStorage.getItem(STORAGE_KEY));
    const o = book.customers.find(x => x.id === c.id);
    return JSON.stringify({ ok: o.compliance.associatedPeopleCSAT.${key} === '${val}' });
  } catch (e) { return JSON.stringify({ ok: false, err: String(e) }); }
})()`;

const r = await inSim(async ctx => {
  const legacy = JSON.parse(await ctx.ev(LEGACY));
  const s1 = JSON.parse(await ctx.ev(ROUND('data-fp-csat-sent', 'surveySentOn', '2026-10-14')));
  const s2 = JSON.parse(await ctx.ev(ROUND('data-fp-csat-answered', 'surveyAnsweredOn', '2026-10-16')));
  if (!legacy.ok || !s1.ok || !s2.ok) console.log('detail ' + JSON.stringify({ legacy, s1, s2 }));
  return { legacy: !!legacy.ok, saved: !!(s1.ok && s2.ok) };
}).catch(e => { console.log('l12 persist tool error: ' + e.message); return { legacy: false, saved: false }; });
const ok = r.legacy && r.saved;
console.log('L12-PERSIST ' + JSON.stringify({ legacy: r.legacy, saved: r.saved, ok }));
process.exit(ok ? 0 : 1);
