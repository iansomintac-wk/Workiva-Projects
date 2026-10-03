// Real Gong adapter (connect-ready §3.3). T-2 registers the name and its proof state; listCalls arrives in T-5.
import { loadProof, isProven, tenantOf, healthName } from '../lib/state.mjs';

export function create(cfg = {}, deps = {}) {
  return {
    get name() { return healthName('gong-rest', { proven: isProven(loadProof(deps.stateDir), 'gong', 'read', tenantOf('gong', cfg)) }); },
    async listCalls() { throw new Error('gong-rest: listCalls is not built yet (connect-ready T-5)'); },
  };
}
