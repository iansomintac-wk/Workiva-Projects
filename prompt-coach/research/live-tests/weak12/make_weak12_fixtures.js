// Synthetic weak-12 live-test files from drafts.json. VENDOR=<npm dir> node make_weak12_fixtures.js (writes ./fixtures). Invented data only.
const fs = require('fs'), path = require('path');
const V = (process.env.VENDOR || 'C:/Users/teasp/AppData/Local/Temp/prompt-coach-rewrites-4756fc2d/vendor') + '/node_modules/';
const OUT = path.join(__dirname, 'fixtures');

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const WNS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';

async function docxBuf(JSZip, title, paras) {
  const P = (t) => `<w:p><w:r><w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p>`;
  const body = `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>${esc(title)}</w:t></w:r></w:p>` + paras.map(P).join('');
  const z = new JSZip();
  z.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>');
  z.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>');
  z.file('word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
  z.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ${WNS}><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style></w:styles>`);
  z.file('docProps/core.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator>synthetic</dc:creator></cp:coreProperties>');
  z.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${WNS}><w:body>${body}</w:body></w:document>`);
  return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}


const DRAFTS = require('./drafts.json');

async function main() {
  const JSZip = require(V + 'jszip'), XLSX = require(V + 'xlsx');
  fs.mkdirSync(OUT, { recursive: true });
  for (const { fixture: s } of DRAFTS) {
    const f = path.join(OUT, s.file);
    if (s.type === 'xlsx') {
      const rows = s.rows.map((r) => r.map((c) => (c === '' ? null : c)));
      if (s.units) { while (rows.length < 7) rows.push([]); rows.push([/'([^']+)'/.test(s.units) ? s.units.match(/'([^']+)'/)[1] : 'All amounts ' + s.units]); }
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, s.sheet);
      wb.Props = { Author: 'synthetic', CreatedBy: 'synthetic' };
      XLSX.writeFile(wb, f);
    } else if (s.type === 'docx') fs.writeFileSync(f, await docxBuf(JSZip, s.title, s.paragraphs));
    else throw new Error('unknown fixture type ' + s.type);
  }
  console.log('wrote', fs.readdirSync(OUT).length, 'files');
}
main();
