// Command-line commands for connector/server.mjs (connect-ready §3.5). Node built-ins only.
import readline from 'node:readline';
import { Writable } from 'node:stream';
import { runUnlock } from './unlock.mjs';

export const COMMANDS = ['--unlock-production'];

// ask(question, {secret}) -> answer. A secret answer is never echoed: in a terminal readline echoes into `sink`, which drops it.
export function makeAsk(input = process.stdin, output = process.stdout) {
  let muted = false;
  const sink = new Writable({ write(chunk, enc, cb) { if (!muted) output.write(chunk, enc); cb(); } });
  const rl = readline.createInterface({ input, output: sink, terminal: !!input.isTTY });
  const ask = (q, { secret = false } = {}) => new Promise((res) => {
    output.write(q);
    muted = secret;
    rl.question('', (a) => { muted = false; if (secret) output.write('\n'); res(a); });
  });
  ask.close = () => rl.close();
  return ask;
}

export async function runCli(argv, { config = {}, configPath, stateDir, ask, out = console.log, deps = {} } = {}) {
  if (argv.includes('--unlock-production')) return runUnlock({ cfg: config.gainsight || {}, stateDir, ask, out });
  out(`unknown command: ${argv.join(' ')}`);
  return 2;
}
