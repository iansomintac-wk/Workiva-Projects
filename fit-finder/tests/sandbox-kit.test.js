/* node tests/sandbox-kit.test.js  The sandbox kit must be complete, made-up, pasteable and honest about the page's prompt. */
const fs = require('fs'), path = require('path');
const { load, message, BR } = require('./sandbox-kit.js');
const { patternPrompt, match } = require('../engine/fit.js');
const cat = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/catalogue.json'), 'utf8'));
let n = 0, fails = 0;
const ok = (name, cond, detail) => { n++; if (!cond) { fails++; console.log('FAIL ' + name + (detail ? ': ' + detail : '')); } };
let cards;
try { cards = load(); } catch (e) { console.log('FAIL key does not load: ' + e.message); process.exit(1); }
const count = (s, sub) => s.split(sub).length - 1;
const hasBracket = (s) => /\[[^\]]+\]/.test(s);
ok('key has 8 cards', cards.length === 8, 'found ' + cards.length);
const per = {}; cards.forEach((c) => { per[c.area] = (per[c.area] || 0) + 1; });
ok('two cards in each of FR, GRC, SUS, GEN', ['FR', 'GRC', 'SUS', 'GEN'].every((a) => per[a] === 2) && Object.keys(per).length === 4, JSON.stringify(per));
const sheet = fs.existsSync(path.join(__dirname, '../sandbox/scoring-sheet.md')) ? fs.readFileSync(path.join(__dirname, '../sandbox/scoring-sheet.md'), 'utf8') : '';
ok('scoring sheet names all 8 cards', cards.every((c) => sheet.includes(c.id)));
const msg = message(cards);
ok('batch message holds all 8 prompts, no answer key, under 30000 characters', cards.every((c) => msg.includes(c.prompt)) && !/planted/i.test(msg) && msg.length < 30000, 'length ' + msg.length);
for (const c of cards) {
  ok(c.id + ': page lists this card for its sample task and shows this prompt', c.raw.length > 0 && patternPrompt(c.sample, c.u) === c.raw && match(c.sample, cat).some((u) => u.id === c.id));
  ok(c.id + ': file is small, made up and clean', c.fileText.length <= 2500 && /^MADE-UP TEST DATA/.test(c.fileText) && !/[@]|http|planted/i.test(c.fileText), 'length ' + c.fileText.length);
  const ids = (c.planted || []).map((p) => p.id);
  ok(c.id + ': five planted items with unique ids', ids.length === 5 && new Set(ids).size === 5 && (c.planted || []).every((p) => p.find && p.note));
  ok(c.id + ': every planted item appears exactly once in the file', (c.planted || []).every((p) => count(c.fileText, p.find) === 1), (c.planted || []).filter((p) => count(c.fileText, p.find) !== 1).map((p) => p.id).join(','));
  ok(c.id + ': prompt has no [bracket] left', !hasBracket(c.prompt), (c.prompt.match(BR) || []).join(' '));
  ok(c.id + ': prompt has no planted-item text', !(c.planted || []).some((p) => c.prompt.includes(p.find)));
}
console.log(fails ? `sandbox-kit tests FAILED: ${fails} of ${n}` : `sandbox-kit tests pass: ${n}`);
process.exit(fails ? 1 : 0);
