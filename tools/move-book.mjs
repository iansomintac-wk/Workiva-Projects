#!/usr/bin/env node
// D4: prove a book moves from the file:// copy to the served copy. Two throwaway Chrome profiles (selfcheck.mjs makes and
// deletes them), test book only (demo-seed.js + the first 3 calls of tools/step1-fixture.js), nothing touches Ian's Chrome.
//   node tools/move-book.mjs
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const HINT = 'New address, no book here yet. Export from your old copy, then Import here (Settings).';

export function compareFingerprints(o, i) {
  const same = ['accounts', 'activities', 'transcripts', 'tsSha256'].every(k => o[k] === i[k]);
  const ok = same && o.transcripts > 0;
  return { ok, lines: [ok
    ? `C6 PASS accounts ${o.accounts}/${i.accounts} activities ${o.activities}/${i.activities} transcripts ${o.transcripts}/${i.transcripts} sha256 ${o.tsSha256} (equal both sides)`
    : `C6 FAIL out ${JSON.stringify(o)} in ${JSON.stringify(i)}${o.transcripts > 0 ? '' : ' (zero transcripts is not a pass)'}`] };
}
export function checkHint(d) {
  const ok = d.hintBefore === HINT && d.hintAfter === null;
  return { ok, lines: [ok ? 'C4 PASS hint visible on the empty served book, hidden after import'
    : `C4 FAIL hint before=${JSON.stringify(d.hintBefore)} after=${JSON.stringify(d.hintAfter)}`] };
}
export function c7Line(out) {
  if (!out.keyStored) return { ok: false, lines: ['C7 FAIL the fake AI key was not stored before Export, so the finding would prove nothing'] };
  return { ok: true, lines: [`C7 FINDING AI key in Export: ${out.aiKeyInExport ? 'present' : 'absent'} (stored fake key searched for in ${String(out.exportText || '').length} bytes of Export text)`] };
}

function main() {
  const tmp = mkdtempSync(join(tmpdir(), 'move-book-'));
  console.log(`temp dir: ${tmp}`);
  const sc = (...a) => spawnSync(process.execPath, ['tools/selfcheck.mjs', 'osm-book-of-business-tracker-1.1.html', ...a], { encoding: 'utf8' });
  let code = 1;
  try {
    const b = spawnSync(process.execPath, ['tools/build-site.mjs'], { encoding: 'utf8' });
    if (b.status !== 0) { console.log(b.stdout + b.stderr); return finish(tmp, 1); }
    const outFile = join(tmp, 'out.json'), inFile = join(tmp, 'in.json');
    const r1 = sc('--seed', 'demo-seed.js,tools/step1-fixture.js,tools/hosting-probe.js', '--fn', 'hostingMoveOut', '--expect', '2', '--dump', outFile);
    if (r1.status !== 0) { console.log('move out failed\n' + r1.stdout + r1.stderr); return finish(tmp, 1); }
    const out = JSON.parse(readFileSync(outFile, 'utf8'));
    const seedFile = join(tmp, 'incoming-seed.js');
    writeFileSync(seedFile, 'window.__incoming = ' + JSON.stringify(out.exportText) + ';\n');
    const r2 = sc('--serve', 'site', '--seed', seedFile + ',tools/hosting-probe.js', '--fn', 'hostingMoveIn', '--expect', '1', '--dump', inFile);
    if (r2.status !== 0) { console.log('move in failed\n' + r2.stdout + r2.stderr); return finish(tmp, 1); }
    const inn = JSON.parse(readFileSync(inFile, 'utf8'));
    const c6 = compareFingerprints(out.fp, inn.fp), c4 = checkHint(inn), c7 = c7Line(out);
    console.log(c6.lines.join('\n')); console.log(c4.lines.join('\n')); console.log(c7.lines.join('\n'));
    code = c6.ok && c4.ok && c7.ok ? 0 : 1;
  } catch (e) { console.log('move-book failed: ' + (e && e.message || e)); }
  return finish(tmp, code);
}
function finish(tmp, code) {
  rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  console.log(`temp dir removed: ${existsSync(tmp) ? 'no' : 'yes'}`);
  return code;
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main());
