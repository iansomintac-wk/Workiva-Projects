// loadAdapters(config, opts) -> {gong, gainsight, ai, snowflake}. Gong and Gainsight may be fake or the real
// gong-rest / gainsight-rest (unproven until `--check`). AI may be fake, claude,
// openai or gemini (R1: no other provider); any other name throws. opts.fetchImpl and opts.env are injection points
// for tests; the AI key comes from config.ai.apiKey or env CONNECTOR_AI_KEY, never from a request.
import { create as gong } from './gong-fake.mjs';
import { create as gainsight } from './gainsight-fake.mjs';
import { create as gongRest } from './gong-rest.mjs';
import { create as gainsightRest } from './gainsight-rest.mjs';
import { create as aiFake } from './ai-fake.mjs';
import { create as aiClaude } from './ai-claude.mjs';
import { create as aiOpenai } from './ai-openai.mjs';
import { create as aiGemini } from './ai-gemini.mjs';
import { create as snowflakeFake } from './snowflake-fake.mjs';
import { create as snowflakeSql } from './snowflake-sql.mjs';

const BUILT = {
  gong: { fake: gong, 'gong-rest': gongRest },
  gainsight: { fake: gainsight, 'gainsight-rest': gainsightRest },
  ai: { fake: aiFake, claude: aiClaude, openai: aiOpenai, gemini: aiGemini },
  snowflake: { fake: snowflakeFake, 'snowflake-sql': snowflakeSql },
};
const REAL = new Set(['gong-rest', 'gainsight-rest', 'snowflake-sql']);

export function loadAdapters(config = {}, opts = {}) {
  const { fetchImpl, env = process.env, stateDir, sleep, now, tokenSource, pageLimit, ...rest } = opts;
  const out = {};
  for (const slot of Object.keys(BUILT)) {
    const cfg = config[slot] || {};
    const name = cfg.adapter || 'fake';
    const factory = BUILT[slot][name];
    if (!factory) throw new Error(`adapter not built: ${name}`);
    if (slot === 'ai' && name !== 'fake') {
      out[slot] = factory({ model: cfg.model, apiKey: cfg.apiKey || env.CONNECTOR_AI_KEY || '' }, fetchImpl || globalThis.fetch);
    } else if (REAL.has(name)) {
      out[slot] = factory(cfg, { fetchImpl, stateDir, sleep, now, tokenSource, pageLimit });
    } else {
      out[slot] = factory({ ...cfg, ...rest, now });
    }
  }
  return out;
}
