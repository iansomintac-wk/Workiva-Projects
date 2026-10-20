// usage: node tools/sf-field-drive.mjs [--control]    (--control runs the pre-change tracker 56206c4; it must FAIL)
import { inSimVersion, withTracker, isMain, DAY } from './lib/drive-sim.mjs';

export function judgeSfField(r) {
  const checks = {
    boxFound: r.boxFound === true,
    savedAfterReload: r.afterReload === r.typed,
    gainsightUntouchedBySet: r.gidAfterSet === r.gidBefore,
    clearRemovesKey: r.keyPresentAfterClear === false,
    clearStaysAfterReload: r.keyPresentAfterClearReload === false,
    gainsightUntouchedByClear: r.gidAfterClear === r.gidBefore
  };
  const failed = Object.keys(checks).filter(k => !checks[k]);
  return { passed: failed.length === 0, evidence: failed.length ? 'failed: ' + failed.join(', ') : 'box found, saved across reload, cleared key removed, gainsightId untouched' };
}

const TYPED = '001FAKEDRIVE00001AA';
const J = (ctx, js) => ctx.ev(`JSON.stringify((() => { ${js} })())`).then(JSON.parse);
const OPEN = id => `ui.view = 'accounts'; ui.openCustomerId = ${JSON.stringify(id)}; ui.panelTab = 'details'; render();`;
const READ = id => `const c = DATA.customers.find(x => x.id === ${JSON.stringify(id)}); return { sf: c.salesforceId, has: 'salesforceId' in c, gid: c.gainsightId };`;

export async function driveSf(version) {
  return inSimVersion(version, 'sf-field', async ctx => {
    const id = await J(ctx, `const c = DATA.customers[0]; c.gainsightId = 'GS-DRIVE-KEEP'; delete c.salesforceId; saveData(); return c.id;`);
    const r = { typed: TYPED, gidBefore: 'GS-DRIVE-KEEP' };
    r.boxFound = await J(ctx, `${OPEN(id)} return !!document.getElementById('cust-salesforce-id');`);
    if (!r.boxFound) return judgeSfField(r);
    await ctx.type('#cust-salesforce-id', TYPED);
    await ctx.openOn(DAY);
    const a = await J(ctx, READ(id));
    r.afterReload = a.sf; r.gidAfterSet = a.gid;
    await ctx.ev(`(() => { ${OPEN(id)} return 1; })()`);
    await ctx.type('#cust-salesforce-id', '');
    const b = await J(ctx, READ(id));
    r.keyPresentAfterClear = b.has; r.gidAfterClear = b.gid;
    await ctx.openOn(DAY);
    r.keyPresentAfterClearReload = (await J(ctx, READ(id))).has;
    return judgeSfField(r);
  });
}

if (isMain(import.meta.url)) {
  const control = process.argv.includes('--control');
  let res;
  try { res = await withTracker(control, v => driveSf(v)); } catch (e) { res = { passed: false, evidence: 'error: ' + String(e && e.message || e).slice(0, 200) }; }
  console.log((res.passed ? 'OK' : 'FAIL') + ' sf-field: ' + res.evidence);
  process.exit(res.passed ? 0 : 1);
}
