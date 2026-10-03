// --check / --check --write (connect-ready §3.5). Read-only unless --write against a sandbox. One line per step:
// PASS, FAIL <step>: <what to fix>; who fixes it: <who>, or SKIP. Exit 0 when nothing FAILs. Node built-ins only.
import { loadAdapters } from '../adapters/index.mjs';
import { FIELD_KEYS, GATE_KEYS } from '../adapters/gainsight-rest.mjs';
import { recordProof, tenantOf } from './state.mjs';

const blank = (v) => !String(v == null ? '' : v).trim();

export async function runCheck({ config = {}, stateDir, deps = {}, out = console.log, write = false, now = () => new Date() } = {}) {
  let fails = 0;
  const o = {
    pass: (step, d) => out(`PASS ${step}${d ? `: ${d}` : ''}`),
    fail: (step, what, who) => { fails++; out(`FAIL ${step}: ${what}; who fixes it: ${who}`); },
    skip: (step, why) => out(`SKIP ${step}: ${why}`),
  };
  const ad = loadAdapters(config, { ...deps, stateDir });
  await checkGong(config.gong || {}, ad.gong, o, stateDir, now);
  await checkGainsight(config.gainsight || {}, ad.gainsight, o, stateDir, now, write, config, deps);
  return fails ? 1 : 0;
}

async function checkGong(cfg, gong, o, stateDir, now) {
  if (cfg.adapter !== 'gong-rest') return o.skip('gong', `not configured (adapter is "${cfg.adapter || 'fake'}")`);
  const missing = ['baseUrl', 'accessKey', 'accessKeySecret', 'myEmail'].filter((k) => blank(cfg[k]));
  if (missing.length) return o.fail('gong config', `missing gong.${missing.join(', gong.')}; run node connector/server.mjs --setup`, 'Ian');
  o.pass('gong config');
  let page;
  try { page = await gong.probe(); } catch (e) {
    if (e.status === 401) return o.fail('gong auth', 'Gong rejected the access key or secret; issue a new key (on the Gong API page)', 'Gong admin');
    if (e.status === 403) return o.fail('gong scope', 'the key cannot read call details (may need api:calls:read:extensive, to confirm)', 'Gong admin');
    return o.fail('gong read', e.message, 'Ian (check gong.baseUrl and the network)');
  }
  // F2: only a Gong-shaped reply proves anything: a call list, or Gong's documented "no calls" 404 (F1).
  if (!page || typeof page !== 'object' || !Array.isArray(page.calls)) {
    const keys = page && typeof page === 'object' ? Object.keys(page).join(', ') || 'none' : typeof page;
    return o.fail('gong read', `the reply is not a Gong call list (top-level keys: ${keys})`, 'Ian (check gong.baseUrl)');
  }
  o.pass('gong auth');
  const c = page.calls[0] || {};
  o.pass('gong read', `${page.calls.length} call(s) in the last 24 hours`);
  recordProof(stateDir, 'gong', 'read', { tenant: tenantOf('gong', cfg), now: now(), shapes: {
    ...(page.noCalls ? { noCalls404: true } : {}),
    pageKeys: Object.keys(page), callKeys: Object.keys(c), metaDataKeys: Object.keys(c.metaData || {}),
    contentKeys: Object.keys(c.content || {}), briefType: typeof (c.content || {}).brief } });
  o.pass('gong proof recorded', 'health now reports gong-rest');
}

async function checkGainsight(cfg, gs, o, stateDir, now, write, config, deps) {
  if (cfg.adapter !== 'gainsight-rest') return o.skip('gainsight', `not configured (adapter is "${cfg.adapter || 'fake'}")`);
  const missing = ['appUrl', 'environment'].filter((k) => blank(cfg[k])).map((k) => `gainsight.${k}`);
  if (blank(cfg.oauth && cfg.oauth.clientId)) missing.push('gainsight.oauth.clientId');
  if (missing.length) return o.fail('gainsight config', `missing ${missing.join(', ')}; run node connector/server.mjs --setup`, 'Ian');
  if (!['sandbox', 'production'].includes(cfg.environment)) return o.fail('gainsight config', 'gainsight.environment must be "sandbox" or "production"', 'Ian');
  o.pass('gainsight config', `${cfg.environment} tenant ${cfg.appUrl}`);
  try { await gs.authProbe(); } catch (e) { return o.fail('gainsight auth', e.message, 'Ian (run --setup again)'); }
  o.pass('gainsight auth');
  let first;
  try { first = await gs.probeRead(['Gsid', 'Name']); } catch (e) {
    return o.fail('gainsight read', e.message, e.status === 401 || e.status === 403 ? 'Gainsight admin (OAuth app scope, or bearer tokens not accepted on this API)' : 'Ian');
  }
  o.pass('gainsight read', `rows arrive in ${first.shape}`);
  let fieldFails = 0;
  for (const [group, keys, unmapped] of [['fieldMap', FIELD_KEYS, 'not mapped; /v1/accounts sends null'], ['gateFieldMap', GATE_KEYS, 'not mapped; /v1/accounts sends false']]) {
    for (const k of keys) {
      const f = String((cfg[group] || {})[k] || '').trim();
      if (!f) { o.skip(`gainsight ${group}.${k}`, unmapped); continue; }
      try { await gs.probeRead(['Gsid', f]); o.pass(`gainsight ${group}.${k}`, f); }
      catch (e) { fieldFails++; o.fail(`gainsight ${group}.${k}`, `the tenant rejected field "${f}"`, 'Gainsight admin (give the field\'s API name)'); }
    }
  }
  const q = cfg.contactQuery || {};
  if (q.object && q.companyField && q.nameField) {
    try { await gs.probeRead([q.companyField, q.nameField], q.object); o.pass('gainsight contactQuery', q.object); }
    catch (e) { fieldFails++; o.fail('gainsight contactQuery', `the tenant rejected object or fields (${e.message})`, 'Gainsight admin'); }
  } else o.skip('gainsight contactQuery', 'not configured; contacts are empty');
  if (!fieldFails) {
    recordProof(stateDir, 'gainsight', 'read', { tenant: tenantOf('gainsight', cfg), environment: cfg.environment, now: now(), shapes: { rows: first.shape } });
    o.pass('gainsight read proof recorded');
  }
  if (write) await checkWrite(cfg, o, stateDir, now, first.rows[0], config, deps);
}

async function checkWrite(cfg, o, stateDir, now, company, config, deps) {
  if (cfg.environment !== 'sandbox') return o.fail('gainsight write', `--check --write runs only against a sandbox; this tenant is "${cfg.environment}". Nothing was written`, 'Ian (point the config at the sandbox, or use --unlock-production)');
  if (!company) return o.fail('gainsight write', 'the sandbox returned no Company to write against', 'Gainsight admin');
  const tag = `[SBX] TEST-${now().toISOString().slice(0, 10)}`; // D4: labelled and left in the sandbox
  const stamp = now().toISOString().replace(/[^0-9]/g, '');
  const ref = { gainsightId: String(company.Gsid), name: String(company.Name) };
  const items = [
    { id: `sbx-test-${stamp}-pending`, kind: 'Pending items batch', customerRef: ref, fields: { subjectPrefix: tag, gates: [{ gateKey: 'test', contractKey: 'test', gainsightAction: `${tag} connector self-test` }] } },
    { id: `sbx-test-${stamp}-outcome`, kind: 'Success Outcome Plan', customerRef: ref, fields: { subjectPrefix: tag, outcomes: [`${tag} connector self-test`] } },
    { id: `sbx-test-${stamp}-cta`, kind: 'At-Risk CTA', customerRef: ref, fields: { subjectPrefix: tag, ctaName: 'connector self-test' } },
  ];
  const live = loadAdapters({ gainsight: { ...cfg, dryRun: false } }, { ...deps, stateDir }).gainsight;
  const results = await live.push(items);
  let ok = true;
  results.forEach((r, i) => {
    if (r.status === 'sent') o.pass(`gainsight write ${items[i].kind}`, r.externalId ? `id ${r.externalId}` : 'sent (id not read: gainsight.cta.idPath unset)');
    else { ok = false; o.fail(`gainsight write ${items[i].kind}`, r.error, 'Ian with the Gainsight admin (see CONNECT-GAINSIGHT.md)'); }
  });
  o.skip('gainsight write Success Plan objective', 'not built (blocker B1)');
  o.skip('gainsight write read-back', 'no read endpoint is confirmed (research Q10, Q12); open the sandbox and look for the [SBX] TEST records');
  if (ok) {
    recordProof(stateDir, 'gainsight', 'write', { tenant: tenantOf('gainsight', cfg), environment: 'sandbox', now: now(), shapes: { kinds: items.map((i) => i.kind) } });
    o.pass('gainsight write proof recorded', 'production can now be unlocked with --unlock-production');
  }
}
