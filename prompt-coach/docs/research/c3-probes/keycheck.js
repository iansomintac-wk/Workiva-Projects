// For each weak-12 key item: which of its numbers appear in the fixture spec text. Counts only.
const d = require(process.argv[2]);
let tot = 0, miss = 0;
for (const x of d) {
  const fx = JSON.stringify(x.fixture);
  const nums = (s) => (s.match(/\d+(?:\.\d+)?/g) || []);
  const items = x.key.findings.map((f) => { const n = nums(f); const m = n.filter((v) => !fx.includes(v)); return m; });
  const hardIn = x.key.findings.some((f) => f.toLowerCase().includes(x.key.hard.toLowerCase().split(' ').slice(0, 2).join(' ')));
  tot += items.length; const bad = items.filter((m) => m.length).length; miss += bad;
  console.log(x.id, 'items=' + items.length, 'itemsWithNumberNotInFile=' + bad, bad ? JSON.stringify(items.filter((m) => m.length)) : '', 'mustNot=' + x.key.must_not_invent.length, 'hardMatchesAnItem=' + hardIn, 'seeded=' + (x.fixture.seeded || []).length);
}
console.log('TOTAL items', tot, 'with a number not in fixture spec', miss);
