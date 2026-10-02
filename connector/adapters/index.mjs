// loadAdapters(config, opts) -> {gong, gainsight, ai}. Gong and Gainsight are fake only. AI may be fake, claude,
// openai or gemini (R1: no other provider); any other name throws. opts.fetchImpl and opts.env are injection points
// for tests; the AI key comes from config.ai.apiKey or env CONNECTOR_AI_KEY, never from a request.
import { create as gong } from './gong-fake.mjs';
import { create as gainsight } from './gainsight-fake.mjs';
import { create as aiFake } from './ai-fake.mjs';
import { create as aiClaude } from './ai-claude.mjs';
import { create as aiOpenai } from './ai-openai.mjs';
import { create as aiGemini } from './ai-gemini.mjs';

const BUILT = {
  gong: { fake: gong },
  gainsight: { fake: gainsight },
  ai: { fake: aiFake, claude: aiClaude, openai: aiOpenai, gemini: aiGemini },
};

export function loadAdapters(config = {}, opts = {}) {
  const { fetchImpl, env = process.env, ...rest } = opts;
  const out = {};
  for (const slot of Object.keys(BUILT)) {
    const cfg = config[slot] || {};
    const name = cfg.adapter || 'fake';
    const factory = BUILT[slot][name];
    if (!factory) throw new Error(`adapter not built: ${name}`);
    if (slot === 'ai' && name !== 'fake') {
      out[slot] = factory({ model: cfg.model, apiKey: cfg.apiKey || env.CONNECTOR_AI_KEY || '' }, fetchImpl || globalThis.fetch);
    } else {
      out[slot] = factory({ ...cfg, ...rest });
    }
  }
  return out;
}
