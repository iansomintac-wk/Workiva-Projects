// Pure fakes for the OSM day sim: fake clock, prompt-routed fake AI, fake connector.
// Prompt markers read from the trackers (1.0 / 1.1 line numbers):
//   review     "GROUNDING RULES — these are the contract"            1.0:2952 / 1.1:3185
//   extraction "extracting domain-score change suggestions"          1.0:2824 / 1.1:2839
// Review JSON keys: answers[], email{subject,body}                    1.0:2974 / 1.1:3207
export const REVIEW_MARKER = 'GROUNDING RULES — these are the contract';
export const EXTRACT_MARKER = 'extracting domain-score change suggestions';

export const CORS = [
  { name: 'Access-Control-Allow-Origin', value: '*' },
  { name: 'Access-Control-Allow-Headers', value: '*' },
  { name: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
  { name: 'Content-Type', value: 'application/json' },
];

// Source string run before the page script: Date starts at <iso> 09:00 local and keeps ticking.
export function clockShim(iso) {
  return `(() => { const R = Date, off = R.parse('${iso}T09:00:00') - R.now();
  class F extends R { constructor(...a) { a.length ? super(...a) : super(R.now() + off); } static now() { return R.now() + off; } }
  F.parse = R.parse; F.UTC = R.UTC; globalThis.Date = F; })();`;
}

export function callReviewReply({ email = true } = {}) {
  const o = { answers: [] };
  if (email) o.email = { subject: 'SIM recap of our session', body: 'SIM recap: thanks for your time today.' };
  return JSON.stringify(o);
}

function textFor(promptText, opts) {
  const p = String(promptText || '');
  if (p.includes(REVIEW_MARKER)) return callReviewReply({ email: opts.email !== false });
  if (p.includes(EXTRACT_MARKER)) return '[]';
  return 'SIM-REPLY: coverage looked fine; no training signal; no additional matches.';
}

export function aiBody(url, promptText, opts = {}) {
  const t = textFor(promptText, opts);
  const host = new URL(url).host;
  if (host.includes('anthropic')) return { content: [{ type: 'text', text: t }], stop_reason: 'end_turn' };
  if (host.includes('openai')) return { choices: [{ message: { role: 'assistant', content: t }, finish_reason: 'stop' }] };
  return { candidates: [{ content: { parts: [{ text: t }] }, finishReason: 'STOP' }] };
}

export function connectorReply(requestBodyText) {
  let items = [];
  try { items = JSON.parse(requestBodyText).items || []; } catch {}
  return { results: items.map(i => ({ id: i.id, status: 'sent', externalId: `SIM-EXT-${i.id}` })) };
}

export function connectorUrl(port) {
  if (!Number.isInteger(port) || port < 9900 || port > 9999) throw new Error(`connector port ${port} outside 9900-9999`);
  return `http://127.0.0.1:${port}`;
}
