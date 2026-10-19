/* Sandbox kit builder. node tests/sandbox-kit.js --tokens [card ids] | --build <dir> [--only id,id]
   Reads sandbox/key.json and the catalogue. A card's prompt is its own fuller prompt (what the page shows for the card's sample task)
   with every [bracket] filled from the key. */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const cat = JSON.parse(fs.readFileSync(path.join(root, 'data/catalogue.json'), 'utf8'));
const BR = /\[[^\]]+\]/g;
const card = (id) => { const u = cat.useCases.find((x) => x.id === id); if (!u) throw new Error('unknown card ' + id); return u; };
function load(keyPath) {
  const key = JSON.parse(fs.readFileSync(keyPath || path.join(root, 'sandbox/key.json'), 'utf8'));
  return key.map((k) => {
    const u = card(k.card), s = cat.surfaces[u.surfaces[0]], raw = u.prompt || '';
    const prompt = raw.replace(BR, (m) => (k.fill && k.fill[m] !== undefined ? k.fill[m] : m));
    const fileText = fs.readFileSync(path.join(root, 'sandbox', k.file), 'utf8');
    return { ...k, id: u.id, area: u.area, task: u.task, sample: u.try, feature: s.name, how: s.how, raw, prompt, fileText, u };
  });
}
function message(cards) {
  const head = ['# Workiva AI sandbox check: ' + cards.length + ' prompts', '',
    'For each card below, open a new Workiva AI chat. If your sandbox lets you add the made-up file to a workspace (two files where the file has a CURRENT YEAR and a PRIOR YEAR part), add it and select it with @ as the prompt says; otherwise paste the file text under the prompt and tell me you did. Copy each reply back as text, not a screenshot. For each card also tell me whether you found the feature the card names where the card says (yes, no, or where it actually is). Every file is made up.', ''];
  const body = cards.map((c, i) => ['==========', '## Card ' + (i + 1) + ' of ' + cards.length + ': ' + c.id + ' (' + c.area + ')',
    'Feature the card names: ' + c.feature + '. Where the card says to find it: ' + c.how, '', '### Prompt', c.prompt, '', '### File: ' + c.file, '----- file starts -----', c.fileText.trim(), '----- file ends -----', ''].join('\n'));
  return head.concat(body).join('\n');
}
module.exports = { load, message, card, BR };
if (require.main === module) {
  const a = process.argv.slice(2);
  if (a[0] === '--tokens') {
    const explicit = a.slice(1).length > 0;
    const ids = explicit ? a.slice(1) : cat.useCases.map((u) => u.id);
    for (const id of ids) {
      const p = card(id).prompt;
      if (!p) { if (explicit) { console.error(id + ': has no fuller prompt'); process.exit(1); } console.log(id + ': (no fuller prompt)'); continue; }
      console.log(id + ': ' + JSON.stringify([...new Set(p.match(BR) || [])]));
    }
  } else if (a[0] === '--build') {
    const out = a[1], oi = a.indexOf('--only'), only = oi >= 0 ? a[oi + 1].split(',') : null;
    if (!out) { console.error('usage: --build <dir> [--only id,id]'); process.exit(2); }
    const cards = load().filter((c) => !only || only.includes(c.id));
    fs.mkdirSync(out, { recursive: true });
    cards.forEach((c) => fs.writeFileSync(path.join(out, c.id + '.prompt.txt'), c.prompt + '\n'));
    fs.writeFileSync(path.join(out, 'batch-message.md'), message(cards) + '\n');
    console.log('built ' + cards.length + ' cards into ' + out);
  } else { console.error('usage: --tokens [ids] | --build <dir> [--only id,id]'); process.exit(2); }
}
