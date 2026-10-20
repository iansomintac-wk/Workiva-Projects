// Dev tooling (not part of the bundle): NL-5 real keystrokes into the CSAT "Survey sent" box on the Details tab (CDP key events,
// throwaway osmsim-* profile via tools/lib/drive-sim.mjs, synthetic data only). A year typed as 0002 must not be saved, focus stays, a good date saves.
// usage: node tools/csat-keys-check.mjs [--sabotage] [--control]  -> "OK|FAIL keys: ..." then the values, last line "exit N"
//   --sabotage makes the page's own validator accept anything (the judge must then FAIL); --control runs the pre-change tracker.
import { inSimVersion, withTracker, isMain } from './lib/drive-sim.mjs';

export function judgeKeys(r) {
  const checks = {
    badYearReallyTyped: r.badValueTyped === '0002-10-19',
    badYearNotSaved: r.savedAfterBad === r.initialSaved,
    focusKept: r.focusKept === true,
    goodDateSaved: r.goodSaved === '2026-10-19',
    realKeystrokes: r.keyEvents >= 16
  };
  const failed = Object.keys(checks).filter(k => !checks[k]);
  return { passed: failed.length === 0, evidence: (failed.length ? 'failed: ' + failed.join(', ') + '; ' : '') + JSON.stringify(r) };
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const J = v => JSON.stringify(v);

async function drive(ctx, sabotage) {
  let keyEvents = 0;
  const key = async ch => {
    await ctx.send('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch }); keyEvents++;
    await ctx.send('Input.dispatchKeyEvent', { type: 'keyUp', key: ch }); keyEvents++;
  };
  const id = await ctx.ev(`(DATA.customers.find(x => x.name === 'Orion Semiconductor') || {}).id || null`);
  if (!id) throw new Error('account not found: Orion Semiconductor');
  const boxId = 'fp-csat-sent-' + id;
  // the same id also exists in the Orion day pane: scope to the Details tab (outside every .day-pane)
  const box = `([...document.querySelectorAll('[data-fp-csat-sent]')].find(w => !w.closest('.day-pane')))`;
  const saved = () => ctx.ev(`(() => { const c = DATA.customers.find(x => x.id === ${J(id)}); const a = c && c.compliance && c.compliance.associatedPeopleCSAT; return a && a.surveySentOn ? a.surveySentOn : null; })()`);
  const opened = await ctx.ev(`(() => { ui.view = 'today'; ui.openCustomerId = ${J(id)}; ui.panelTab = 'details'; render(); return !!${box}; })()`);
  if (!opened) throw new Error('no Details-tab sent box');
  await sleep(300);
  if (sabotage) await ctx.ev(`(window.csatDateChangeOk = () => true, 1)`);
  const initialSaved = await saved();
  const focus = () => ctx.ev(`(() => { const b = ${box}; if (!b) return false; b.focus(); return document.activeElement === b; })()`);
  if (!(await focus())) throw new Error('could not focus the sent box');
  const order = await ctx.ev(`(() => { const d = new Date(2026, 9, 19); return d.toLocaleDateString(navigator.language, {year:'numeric', month:'2-digit', day:'2-digit'}) + ' | ' + navigator.language; })()`);
  console.log('rendered field order sample: ' + order);
  for (const ch of '10190002') await key(ch);
  await sleep(300);
  const badValueTyped = await ctx.ev(`(${box} || {}).value || ''`);
  const savedAfterBad = await saved();
  const focusKept = await ctx.ev(`(() => { const b = ${box}; return !!b && document.activeElement === b && document.activeElement.id === ${J(boxId)}; })()`);
  await ctx.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8 }); keyEvents++;
  await ctx.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8 }); keyEvents++; // clear the bad date
  for (const ch of "10192026") await key(ch); // clearing re-rendered the box and focus returned to its first segment, so retype all three
  await sleep(500);
  const goodTyped = await ctx.ev(`(${box} || {}).value || ''`);
  const goodSaved = await saved();
  return { initialSaved, badValueTyped, savedAfterBad, focusKept, goodSaved, keyEvents, goodTyped };
}

if (isMain(import.meta.url)) {
  const control = process.argv.includes('--control'), sabotage = process.argv.includes('--sabotage');
  let code = 1;
  try {
    const r = await withTracker(control, v => inSimVersion(v, 'csatkeys', ctx => drive(ctx, sabotage)));
    const j = judgeKeys(r);
    console.log((j.passed ? 'OK' : 'FAIL') + ' keys: ' + j.evidence);
    for (const k of Object.keys(r)) console.log(k + ': ' + JSON.stringify(r[k]));
    code = j.passed ? 0 : 1;
  } catch (e) { console.log('FAIL keys: error: ' + String((e && e.message) || e).slice(0, 300)); code = 1; }
  console.log('exit ' + code);
  process.exit(code);
}
