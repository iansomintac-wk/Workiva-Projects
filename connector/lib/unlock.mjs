// --unlock-production (connect-ready §3.4, D3; plan spec gap 5). Prints the tenant, requires its URL typed back in
// both §3.4 paths (with or without a sandbox write proof), records the unlock against that tenant, and arms the
// 1-item first send. The sandbox write proof, when there is one, is recorded as the basis. Node built-ins only.
import { loadProof, saveProof, tenantOf } from './state.mjs';

const norm = (u) => String(u || '').trim().replace(/\/+$/, '');
const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

export async function runUnlock({ cfg = {}, stateDir, ask, out = console.log, now = () => new Date() }) {
  if (cfg.adapter !== 'gainsight-rest') { out('FAIL unlock: gainsight.adapter is not "gainsight-rest"; run node connector/server.mjs --setup first'); return 1; }
  if (cfg.environment !== 'production') { out(`FAIL unlock: gainsight.environment is "${cfg.environment || ''}"; unlock is for production only (sandbox writes need no unlock)`); return 1; }
  if (!norm(cfg.appUrl)) { out('FAIL unlock: gainsight.appUrl is empty; run node connector/server.mjs --setup first'); return 1; }
  let proof;
  try { proof = loadProof(stateDir); } catch (e) { out(`FAIL unlock: proof.json could not be read (${e.code || e.name}); nothing changed`); return 1; }
  if (!isObj(proof) || (proof.gainsight !== undefined && !isObj(proof.gainsight))) { out('FAIL unlock: proof.json is not in the expected shape; nothing changed'); return 1; }
  const w = proof.gainsight && proof.gainsight.write;
  const sbx = isObj(w) && w.state === 'proven' && w.environment === 'sandbox' ? w : null;
  out(`Production tenant: ${norm(cfg.appUrl)} (tenant id ${cfg.tenantId || 'not set'})`);
  out(sbx ? `Sandbox write proof: passed ${sbx.provenAt} against ${sbx.tenant && sbx.tenant.appUrl}` : 'No sandbox write proof. Unlocking without a sandbox (default D3).');
  out('After unlock, the first Send sends 1 item only. Check it in Gainsight, then Send again.');
  const typed = await ask('Type the production tenant URL to unlock: ');
  if (norm(typed) !== norm(cfg.appUrl)) { out('FAIL unlock: the URL typed does not match the configured tenant; nothing changed'); return 1; }
  proof.gainsight = { ...(proof.gainsight || {}), unlock: { tenant: tenantOf('gainsight', cfg), at: now().toISOString(),
    basis: sbx ? 'sandbox-proof' : 'no-sandbox', sandboxProofAt: sbx ? sbx.provenAt : null, firstSendDone: false } };
  saveProof(stateDir, proof);
  out('PASS unlock: production writes allowed for this tenant; the first Send sends 1 item');
  return 0;
}
