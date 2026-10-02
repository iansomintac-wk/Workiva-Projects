// Throwaway B0 spike: file:// page -> http://127.0.0.1 stub, fresh profile, no --allow-file-access-from-files.
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const D = import.meta.dirname.split('\\').join('/');
const C = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const out = {};
for (const [mode, port] of [['cors', 47811], ['nocors', 47812]]) {
  const logs = [];
  const s = spawn(process.execPath, [`${D}/b0-stub.mjs`, mode, String(port)]);
  s.stdout.on('data', d => logs.push(String(d).trim()));
  await new Promise(r => setTimeout(r, 500));
  let dom = '';
  try {
    dom = execFileSync(C, ['--headless=new', '--disable-gpu', `--user-data-dir=${process.env.TEMP || D}/b0prof${port}`,
      '--virtual-time-budget=4000', '--dump-dom', `file:///${D}/b0-page.html#${port}`], { encoding: 'utf8', timeout: 20000, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (e) { dom = 'chrome error ' + e.message; }
  s.kill();
  console.log(mode, (dom.match(/RESULT[^<]*/) || ['no RESULT ' + dom.slice(0,120)])[0], JSON.stringify(logs));
  out[mode] = { result: (dom.match(/RESULT[^<]*/) || ['no RESULT'])[0], stubSaw: logs };
}
console.log(JSON.stringify(out, null, 1));

