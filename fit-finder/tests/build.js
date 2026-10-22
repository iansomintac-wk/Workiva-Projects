/* Build dist/fit-finder.html: the page with the use-case catalogue, the fit engine and the Prompt Coach's file reader inlined. */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const engine = 'window.FitCatalogue = ' + JSON.stringify(JSON.parse(fs.readFileSync(path.join(root, 'data/catalogue.json'), 'utf8'))) + ';\n' + fs.readFileSync(path.join(root, 'engine/fit.js'), 'utf8') + '\n' + fs.readFileSync(path.join(root, '../prompt-coach/engine/files.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'web/template.html'), 'utf8').replace('/*__ENGINE__*/', () => engine.replace(/<\/script/gi, '<\\/script')).replace(/\r\n/g, '\n');
fs.writeFileSync(path.join(root, 'dist/fit-finder.html'), html);
console.log('dist/fit-finder.html', (html.length / 1024).toFixed(0) + ' KB');
