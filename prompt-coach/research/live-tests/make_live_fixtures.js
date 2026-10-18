// Synthetic live-test files. VENDOR=<npm dir> node make_live_fixtures.js (writes ./fixtures). Invented data only.
const fs = require('fs'), path = require('path');
const V = (process.env.VENDOR || 'C:/Users/teasp/AppData/Local/Temp/prompt-coach-rewrites-4756fc2d/vendor') + '/node_modules/';
const OUT = path.join(__dirname, 'fixtures');

const SPECS = [];
const xlsx = (name, sheet, rows) => SPECS.push({ kind: 'xlsx', name, sheet, rows });
const doc = (name, title, paras) => SPECS.push({ kind: 'docx', name, title, paras });
const pdf = (name, pages) => SPECS.push({ kind: 'pdf', name, pages });

xlsx('fr_flux_q3.xlsx', 'Summary', [['Account', 'Q2 FY26', 'Q3 FY26', 'Change'], ['Revenue', 1200, 1310, 110], ['Cost of revenue', 480, 505, 25], ['SG&A', 210, 268, 58], ['R&D', 150, 152, 2], ['Interest expense', 12, 12, 0]]);
xlsx('fr_trial_balance.xlsx', 'TB', [['Account', 'Balance'], ['Product revenue', 790], ['Service revenue', 520], ['Deferred revenue', 145], ['Accounts receivable', 330]]);
doc('fr_revenue_footnote.docx', 'Note 3: Revenue', ['Example Co recognized product revenue of $790 and service revenue of $510 for the quarter.', 'Deferred revenue was $140 at quarter end.', 'Accounts receivable from contracts with customers was $303 at quarter end.']);
doc('fr_mdna_draft.docx', 'MD&A draft: Liquidity', ['Liquidity. As of the quarter end, Example Co held cash and cash equivalents of $412 million and had no borrowings outstanding under its revolving credit facility.', 'We believe existing cash, together with cash from operations, is sufficient to meet our needs for at least the next twelve months.']);
xlsx('fr_accruals.xlsx', 'Accruals', [['Entry', 'Account', 'Amount', 'Memo'], ['JE-101', 'Accrued bonus', 40, 'Q3 bonus'], ['JE-102', 'Accrued legal', 5, 'Routine'], ['JE-103', 'Accrued legal', 480, ''], ['JE-104', 'Accrued freight', 12, 'Sep freight'], ['JE-105', 'Accrued bonus', 40, 'Q3 bonus']]);
xlsx('grc_rcm.xlsx', 'Controls', [['Control ID', 'Description', 'Owner', 'Frequency'], ['C-01', 'Journal entry review', 'Controller', 'Monthly'], ['C-02', 'Access recertification', '', 'Quarterly'], ['C-03', 'Bank reconciliation', 'Treasury lead', ''], ['C-04', 'Vendor master change approval', '', ''], ['C-05', 'Revenue cutoff review', 'Revenue accountant', 'Monthly']]);
doc('grc_access_policy.docx', 'Access Policy', ['Purpose. This policy sets rules for access to finance systems.', 'Access requests must be approved by the system owner.', 'Accounts are reviewed when needed.', 'Terminated users should lose access.']);
xlsx('grc_test_results.xlsx', 'Testing', [['Control ID', 'Result', 'Deficiency type', 'Note'], ['C-01', 'Pass', '', ''], ['C-02', 'Fail', 'Design', 'No owner named'], ['C-03', 'Fail', 'Operating', 'Two months late'], ['C-04', 'Fail', 'Design', 'No frequency'], ['C-05', 'Pass', '', '']]);
doc('grc_walkthrough.docx', 'Walkthrough: Vendor payments', ['The AP clerk enters the invoice and matches it to the purchase order.', 'The AP supervisor approves any invoice above the approval limit in the payment system.', 'Treasury releases the payment run each Thursday.']);
pdf('sus_utility_invoices.pdf', [['Example Power Co - Invoice', 'Account: 000-111', 'Service address: 100 Sample Street', 'Service period: 9/1/2018 - 9/30/2018', 'Usage: 12,400 kWh', 'Amount due: USD 1,488.00'], ['Example Gas Co - Invoice', 'Account: 000-222', 'Service address: 100 Sample Street', 'Transaction date: 9/18/2018', 'Usage: 310 therms', 'Amount due: USD 372.50'], ['Example Power Co - Invoice', 'Account: 000-333', 'Service address: 200 Sample Avenue', 'Service period: 9/1/2018 - 9/30/2018', 'Usage: 8,050 kWh', 'Amount due: USD 966.00']]);
xlsx('sus_ghg_inventory.xlsx', 'Scope 3', [['Category', 'FY2024', 'FY2025'], ['Purchased goods', 5200, 5350], ['Business travel', 310, 295], ['Employee commuting', 410, 4100], ['Waste', 90, 88]]);
SPECS.push({ kind: 'csv', name: 'sus_supplier_data.csv', text: 'Supplier,Country,Emissions tCO2e\nExample Supplier A,US,120\nExample Supplier B,DE,\nExample Supplier C,PL,45\nExample Supplier D,US,\nExample Supplier E,MX,300\n' });
doc('sus_climate_policy.docx', 'Climate Policy', ['Example Co will measure and report its Scope 1, 2 and 3 emissions each year.', 'The company has set a target to cut Scope 1 and 2 emissions by 42 percent by 2030 from a 2022 base.', 'The board reviews climate risks once a year.']);
pdf('sus_water_bills.pdf', [['Example Water Co - Bill', 'Service address: 100 Sample Street', 'Bill date: 3/12/2019', 'Usage: 42 kgal', 'Amount due: USD 310.00'], ['Example Water Co - Bill', 'Service address: 200 Sample Avenue', 'Bill date: 3/12/2019', 'Usage: 17 kgal', 'Amount due: USD 128.40']]);

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

function pdfBuf(pages) {
  const pdfEsc = (t) => t.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const n = pages.length, objs = [];
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objs[2] = `<< /Type /Pages /Kids [${pages.map((_, i) => `${3 + i} 0 R`).join(' ')}] /Count ${n} >>`;
  const fontNo = 3 + 2 * n, infoNo = fontNo + 1;
  objs[fontNo] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objs[infoNo] = '<< /Author (synthetic) /Creator (synthetic) >>';
  pages.forEach((lines, i) => {
    let y = 740;
    const s = 'BT /F1 12 Tf ' + lines.map((l) => { const r = `1 0 0 1 60 ${y} Tm (${pdfEsc(l)}) Tj`; y -= 18; return r; }).join(' ') + ' ET';
    objs[3 + i] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${3 + n + i} 0 R /Resources << /Font << /F1 ${fontNo} 0 R >> >> >>`;
    objs[3 + n + i] = `<< /Length ${s.length} >>\nstream\n${s}\nendstream`;
  });
  let out = '%PDF-1.4\n'; const off = [];
  for (let i = 1; i < objs.length; i++) { off[i] = out.length; out += `${i} 0 obj\n${objs[i]}\nendobj\n`; }
  const x = out.length;
  out += `xref\n0 ${objs.length}\n0000000000 65535 f \n` + off.slice(1).map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size ${objs.length} /Root 1 0 R /Info ${infoNo} 0 R >>\nstartxref\n${x}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

async function main() {
  const JSZip = require(V + 'jszip'), XLSX = require(V + 'xlsx');
  fs.mkdirSync(OUT, { recursive: true });
  for (const s of SPECS) {
    const f = path.join(OUT, s.name);
    if (s.kind === 'xlsx') {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s.rows), s.sheet);
      wb.Props = { Author: 'synthetic', CreatedBy: 'synthetic' };
      XLSX.writeFile(wb, f);
    } else if (s.kind === 'docx') fs.writeFileSync(f, await docxBuf(JSZip, s.title, s.paras));
    else if (s.kind === 'pdf') fs.writeFileSync(f, pdfBuf(s.pages));
    else fs.writeFileSync(f, s.text);
  }
  console.log('wrote', fs.readdirSync(OUT).length, 'files');
}

module.exports = { SPECS };
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
