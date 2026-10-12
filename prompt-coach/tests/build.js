/* Inline the engine + weights into web/template.html -> dist/prompt-coach.html */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const weights = JSON.parse(read('engine/weights.json'));
if (weights.mode !== 'rulefeat') throw new Error('expected rule-feature weights, got ' + weights.mode);
const engine = [
  'window.SCOPE_WEIGHTS = ' + JSON.stringify(weights) + ';',
  read('engine/rules.js'), read('engine/model.js'), read('engine/rewrite.js'), read('engine/files.js')
].join('\n;\n').replace(/<\/script/gi, '<\\/script');
const html = read('web/template.html').replace('/*__ENGINE__*/', () => engine);
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/prompt-coach.html'), html);
console.log('dist/prompt-coach.html', (html.length / 1024).toFixed(0) + ' KB');
