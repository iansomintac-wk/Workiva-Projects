// Real Gainsight CS adapter (connect-ready §3.3). T-2 registers the name and its proof state; reads arrive in T-7, push in T-8.
import { loadProof, isProven, tenantOf, healthName } from '../lib/state.mjs';

export function create(cfg = {}, deps = {}) {
  return {
    get name() { return healthName('gainsight-rest', { proven: isProven(loadProof(deps.stateDir), 'gainsight', 'read', tenantOf('gainsight', cfg)), dryRun: cfg.dryRun !== false }); },
    async listAccounts() { throw new Error('gainsight-rest: listAccounts is not built yet (connect-ready T-7)'); },
    async push() { throw new Error('gainsight-rest: push is not built yet (connect-ready T-8)'); },
  };
}
