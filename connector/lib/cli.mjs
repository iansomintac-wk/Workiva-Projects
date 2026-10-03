// Command-line commands for connector/server.mjs (connect-ready §3.5). Node built-ins only.
import readline from 'node:readline';
import { Writable } from 'node:stream';
import { runUnlock } from './unlock.mjs';

export const COMMANDS = ['--unlock-production', '--check', '--setup'];

// ask(question, {secret}) -> answer. A secret answer is never echoed: in a terminal readline echoes into `sink`, which drops it.
export function makeAsk(input = process.stdin, output = process.stdout) {
  let muted = false;
  const sink = new Writable({ write(chunk, enc, cb) { if (!muted) output.write(chunk, enc); cb(); } });
  const rl = readline.createInterface({ input, output: sink, terminal: !!input.isTTY });
  // Lines are queued, so input piped in one burst is not lost between questions; end of input answers with ''.
  const lines = []; const waiting = []; let ended = false;
  rl.on('line', (l) => { if (waiting.length) waiting.shift()(l); else lines.push(l); });
  rl.on('close', () => { ended = true; while (waiting.length) waiting.shift()(''); });
  const ask = (q, { secret = false } = {}) => new Promise((res) => {
    output.write(q);
    muted = secret;
    const done = (a) => { muted = false; if (secret) output.write('\n'); res(a); };
    if (lines.length) done(lines.shift());
    else if (ended) done('');
    else waiting.push(done);
  });
  ask.close = () => rl.close();
  return ask;
}

export async function runCli(argv, { config = {}, configPath, stateDir, ask, out = console.log, deps = {}, createConnector } = {}) {
  if (argv.includes('--setup')) {
    const { runSetup } = await import('./setup.mjs');
    return runSetup({ configPath, config, ask, out, deps, stateDir, createConnector });
  }
  if (argv.includes('--unlock-production')) return runUnlock({ cfg: config.gainsight || {}, stateDir, ask, out });
  if (argv.includes('--check')) {
    const { runCheck } = await import('./check.mjs');
    return runCheck({ config, stateDir, out, deps, write: argv.includes('--write') });
  }
  out(`unknown command: ${argv.join(' ')}`);
  return 2;
}
