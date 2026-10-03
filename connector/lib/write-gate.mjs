// Write gate (connect-ready §3.4, CR2, CR3, D3; plan spec gap 5). A non-dry-run push is allowed only for a sandbox
// tenant, or for a production tenant that Ian unlocked with --unlock-production. The unlock is tied to that tenant
// (void when the configured tenant changes), and after unlock the first push sends one item. Fail-closed: a proof
// file that is missing, unreadable or not an object never allows a production write. Node built-ins only.
import { loadProof, saveProof, tenantOf, sameTenant } from './state.mjs';

export const FIRST_SEND_ERROR = 'first live send is 1 item; check it in Gainsight, then Send again';
const NO_ENV = 'writes blocked: gainsight.environment is not set to "sandbox" or "production"; run node connector/server.mjs --setup';
const NO_UNLOCK = 'writes blocked on production: run node connector/server.mjs --check --write against the sandbox, then --unlock-production (or, with no sandbox, --unlock-production alone)';

const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

export function gateFor({ cfg = {}, proof = {} } = {}) {
  if (cfg.environment === 'sandbox') return { allow: true, firstSendOnly: false };
  if (cfg.environment !== 'production') return { allow: false, error: NO_ENV };
  const u = isObj(proof) && isObj(proof.gainsight) && isObj(proof.gainsight.unlock) ? proof.gainsight.unlock : null;
  if (!u || !tenantOf('gainsight', cfg).appUrl || !sameTenant(u.tenant, tenantOf('gainsight', cfg))) return { allow: false, error: NO_UNLOCK };
  return { allow: true, firstSendOnly: u.firstSendDone !== true };
}

// The gate as push uses it: proof.json is read only for production, and a read failure blocks (never sends).
export function gateFromState({ cfg = {}, stateDir }) {
  if (cfg.environment !== 'production') return gateFor({ cfg });
  try { return gateFor({ cfg, proof: loadProof(stateDir) }); }
  catch (e) { return { allow: false, error: `writes blocked on production: proof.json could not be read (${e.code || e.name}); fix or delete it, then run --unlock-production again` }; }
}

export function markFirstSendDone(stateDir, now = new Date()) {
  const proof = loadProof(stateDir);
  if (!isObj(proof) || !isObj(proof.gainsight) || !isObj(proof.gainsight.unlock)) return;
  proof.gainsight.unlock = { ...proof.gainsight.unlock, firstSendDone: true, firstSentAt: now.toISOString() };
  saveProof(stateDir, proof);
}
