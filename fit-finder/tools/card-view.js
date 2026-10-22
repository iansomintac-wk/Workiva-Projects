/* node tools/card-view.js <catalogue> <out>   see tools/README.md */
const fs = require('fs');
const [cf, out] = process.argv.slice(2);
if (!cf || !out) { console.log('usage: card-view.js <catalogue> <out>'); process.exit(1); }
const cat = JSON.parse(fs.readFileSync(cf, 'utf8'));
const cards = cat.useCases.map((u) => { const c = Object.assign({}, u); delete c.match; delete c.ops; return c; });
fs.writeFileSync(out, JSON.stringify({ useCases: cards }, null, 1) + '\n');
console.log('cards ' + cards.length);
