// Gemini adapter. Ported from the tracker's callGeminiAPI; the key goes in the x-goog-api-key header, never the URL.
import { postJson, requireKey } from './ai-shared.mjs';

export function create({ model, apiKey } = {}, fetchImpl = globalThis.fetch) {
  const m = model || 'gemini-2.5-flash';
  return {
    name: 'gemini',
    model: m,
    async complete({ prompt, maxTokens }) {
      requireKey('gemini', apiKey);
      const data = await postJson({
        fetchImpl, host: 'generativelanguage.googleapis.com', key: apiKey, invalidKeyStatuses: [400, 403],
        url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent`,
        headers: { 'x-goog-api-key': apiKey, 'content-type': 'application/json' },
        body: { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: maxTokens } },
      });
      const cand = (data.candidates || [])[0];
      const parts = (cand && cand.content && cand.content.parts) || [];
      return parts.map((p) => p.text || '').join('\n').trim();
    },
  };
}
