// Check helper for docs/EXTENSION_PROGRESS.md: counts our throwaway folders left in the OS temp dir.
// Prints "left N". Baseline when scouted: 1 (fieldtest-XciUO4, not ours).
import { readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
const n = readdirSync(tmpdir()).filter(x => /^(osmsim|fieldtest|clockspike|aispike)-/.test(x)).length;
console.log('left', n);
