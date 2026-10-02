// FAKE AI adapter. No network, no key. Canned output only.
export function create() {
  return {
    name: 'fake',
    async complete({ task, prompt }) {
      if (task === 'brief_my_day') {
        const ids = [...String(prompt).matchAll(/\[id:([^\]\s]+)\]/g)].map((m) => m[1]);
        return JSON.stringify({
          accounts: ids.map((id) => ({
            id, nextAction: 'FAKE next action',
            flags: [{ kind: 'drift', text: 'FAKE drift flag', reason: 'FAKE reason' }],
            reason: 'FAKE reason',
          })),
        });
      }
      return `FAKE AI (${task}): ${String(prompt).slice(0, 80)}`;
    },
  };
}
