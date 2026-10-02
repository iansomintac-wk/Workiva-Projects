// Claude adapter. Ported from the tracker's callClaudeAPI (endpoint, headers, body, parsing, error mapping);
// the browser-only anthropic-dangerous-direct-browser-access header is dropped. The key comes from config or env only.
import { postJson, requireKey } from './ai-shared.mjs';

export function create({ model, apiKey } = {}, fetchImpl = globalThis.fetch) {
  const m = model || 'claude-sonnet-5';
  return {
    name: 'claude',
    model: m,
    async complete({ prompt, maxTokens }) {
      requireKey('claude', apiKey);
      const data = await postJson({
        fetchImpl, host: 'api.anthropic.com', key: apiKey, invalidKeyStatuses: [401],
        url: 'https://api.anthropic.com/v1/messages',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: { model: m, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] },
      });
      return {
        text: (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim(),
        truncated: data.stop_reason === 'max_tokens',
      };
    },
  };
}
