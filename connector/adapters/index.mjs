// loadAdapters(config) -> {gong, gainsight, ai}. Only fakes exist; any other name throws.
import { create as gong } from './gong-fake.mjs';
import { create as gainsight } from './gainsight-fake.mjs';
import { create as ai } from './ai-fake.mjs';

const BUILT = { gong: { fake: gong }, gainsight: { fake: gainsight }, ai: { fake: ai } };

export function loadAdapters(config = {}, opts = {}) {
  const out = {};
  for (const slot of Object.keys(BUILT)) {
    const name = (config[slot] && config[slot].adapter) || 'fake';
    const factory = BUILT[slot][name];
    if (!factory) throw new Error(`adapter not built: ${name}`);
    out[slot] = factory({ ...(config[slot] || {}), ...opts });
  }
  return out;
}
