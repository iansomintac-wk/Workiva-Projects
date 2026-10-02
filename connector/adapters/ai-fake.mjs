// FAKE AI adapter (stub for B2; B3 fills it out). No network.
export function create() {
  return {
    name: 'fake',
    async complete({ task }) {
      return `FAKE AI (${task})`;
    },
  };
}
