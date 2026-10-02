// OpenAI adapter (Chat Completions). Ported from the tracker's callOpenAIAPI. The key comes from config or env only.
import { postJson, requireKey } from './ai-shared.mjs';

export function create({ model, apiKey } = {}, fetchImpl = globalThis.fetch) {
  const m = model || 'gpt-5.4-mini';
  return {
    name: 'openai',
    model: m,
    async complete({ prompt, maxTokens }) {
      requireKey('openai', apiKey);
      const data = await postJson({
        fetchImpl, host: 'api.openai.com', key: apiKey, invalidKeyStatuses: [401],
        url: 'https://api.openai.com/v1/chat/completions',
        headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: { model: m, messages: [{ role: 'user', content: prompt }], max_tokens: maxTokens },
      });
      const choice = (data.choices || [])[0];
      return ((choice && choice.message && choice.message.content) || '').trim();
    },
  };
}
