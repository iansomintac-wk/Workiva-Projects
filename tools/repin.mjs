// Re-pin the 1.1 tracker sha256 in docs/HOSTING.md and tools/sim/osm-day/verify.mjs (C8) from the working file.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function repinTexts(bytes, hostingText, verifyText) {
  if (bytes.includes(13)) throw new Error('repin: the working file has CR bytes; refresh it (rm + git restore) first');
  const sha = createHash('sha256').update(bytes).digest('hex');
  const sub = (name, text, re) => {
    if (!re.test(text)) throw new Error('repin: pattern not found in ' + name);
    return text.replace(re, (m, a, b) => a + sha + b);
  };
  return {
    sha,
    hosting: sub('docs/HOSTING.md', hostingText, /(Its sha256 is `)[0-9a-f]{64}(`)/),
    verify: sub('tools/sim/osm-day/verify.mjs', verifyText, /('1\.1': ')[0-9a-f]{64}(')/)
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const r = repinTexts(readFileSync('osm-book-of-business-tracker-1.1.html'), readFileSync('docs/HOSTING.md', 'utf8'), readFileSync('tools/sim/osm-day/verify.mjs', 'utf8'));
    writeFileSync('docs/HOSTING.md', r.hosting); writeFileSync('tools/sim/osm-day/verify.mjs', r.verify);
    console.log('repinned 1.1 ' + r.sha.slice(0, 8));
  } catch (e) { console.error(e.message); process.exit(1); }
}
