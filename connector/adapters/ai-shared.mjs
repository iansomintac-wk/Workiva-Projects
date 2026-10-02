// Shared by the three real AI adapters. No network here; callers pass an injected fetch.
const TIMEOUT_MS = 60000;

export function scrub(text, key) {
  let s = String(text == null ? '' : text);
  if (key) s = s.split(key).join('[redacted]');
  return s;
}

// POST json, map failures to Errors that never contain the key.
export async function postJson({ fetchImpl, url, headers, body, host, key, invalidKeyStatuses }) {
  if (typeof fetchImpl !== 'function') throw new Error('no fetch available');
  let resp;
  try {
    resp = await fetchImpl(url, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (e) {
    if (e && (e.name === 'TimeoutError' || e.name === 'AbortError')) throw new Error('The request timed out after 60 seconds.');
    throw new Error(`Network error reaching ${host}.`);
  }
  if (!resp.ok) {
    let detail = '';
    try {
      const j = await resp.json();
      detail = (j.error && j.error.message) ? j.error.message : JSON.stringify(j);
    } catch (e) { detail = resp.statusText || ''; }
    if (invalidKeyStatuses.includes(resp.status)) detail = 'Invalid API key. Check the key in the connector config.';
    throw new Error(scrub(detail || `HTTP ${resp.status}`, key));
  }
  return resp.json();
}

export function requireKey(name, apiKey) {
  if (!apiKey) throw new Error(`No API key configured for ${name} (set ai.apiKey in connector/config.json or CONNECTOR_AI_KEY).`);
}
