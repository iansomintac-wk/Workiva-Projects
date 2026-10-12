/* Browser-side file reading. Libraries load from cdnjs only when a file of that type is added.
   readFile(File) -> {name, kind, text, sheets?:[{name, headers}], headings?:[], slides?:[], periods:[], detail} */
(function (root) {
  const LIBS = {
    mammoth: 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js',
    xlsx: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    jszip: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
    pdf: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    pdfWorker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  };
  const loaded = {};
  function load(key) {
    if (!loaded[key]) loaded[key] = new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = LIBS[key]; s.onload = res;
      s.onerror = () => { delete loaded[key]; rej(new Error('Could not load the reader for this file type. Check your connection and try again.')); };
      document.head.append(s);
    });
    return loaded[key];
  }
  const MAX_TEXT = 60000;
  const PERIOD = /\b(?:FY|CY)\s?'?\d{2,4}\b|\bQ[1-4]\s?(?:FY)?\s?'?\d{2,4}\b|\b(?:19|20)\d{2}\b/g;
  function periodsOf(s) {
    const counts = {};
    for (const m of String(s).match(PERIOD) || []) { const k = m.replace(/\s+/g, ' ').trim(); counts[k] = (counts[k] || 0) + 1; }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k]) => k)
      .filter((k) => !/^(?:19|20)\d{2}$/.test(k) || +k >= 2015 && +k <= 2035).sort();
  }
  function headerRow(rows) {
    for (const r of rows.slice(0, 12)) {
      const cells = (r || []).map((c) => (c == null ? '' : String(c).trim())).filter(Boolean);
      const texty = cells.filter((c) => /[A-Za-z]/.test(c) && c.length < 40);
      if (texty.length >= 2) return cells.slice(0, 10);
    }
    return [];
  }

  async function readFile(file) {
    const name = file.name, ext = name.split('.').pop().toLowerCase();
    if (['txt', 'md', 'csv'].includes(ext)) {
      const text = (await file.text()).slice(0, MAX_TEXT);
      const out = { name, kind: ext === 'csv' ? 'CSV' : 'Text', text, periods: periodsOf(text) };
      if (ext === 'csv') { const first = text.split(/\r?\n/).slice(0, 5).map((l) => l.split(',')); out.sheets = [{ name: name.replace(/\.csv$/i, ''), headers: headerRow(first) }]; }
      return out;
    }
    const buf = await file.arrayBuffer();
    if (ext === 'docx') {
      await load('mammoth');
      const html = (await root.mammoth.convertToHtml({ arrayBuffer: buf })).value;
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const headings = [...doc.querySelectorAll('h1,h2,h3')].map((h) => h.textContent.trim()).filter(Boolean).slice(0, 30);
      const text = doc.body.textContent.replace(/\s+/g, ' ').slice(0, MAX_TEXT);
      return { name, kind: 'Word', text, headings, periods: periodsOf(text), detail: headings.length ? headings.length + ' headings' : '' };
    }
    if (['xlsx', 'xlsm', 'xls'].includes(ext)) {
      await load('xlsx');
      const wb = root.XLSX.read(buf, { type: 'array' });
      const sheets = [], parts = [];
      for (const n of wb.SheetNames) {
        const rows = root.XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, blankrows: false, raw: false });
        const headers = headerRow(rows);
        sheets.push({ name: n, headers });
        parts.push('## ' + n + '\n' + rows.slice(0, 200).map((r) => r.join(', ')).join('\n'));
      }
      const text = parts.join('\n\n').slice(0, MAX_TEXT);
      return { name, kind: 'Excel', text, sheets, periods: periodsOf(sheets.map((s) => s.headers.join(' ')).join(' ') + ' ' + text.slice(0, 8000)), detail: sheets.length + (sheets.length === 1 ? ' sheet' : ' sheets') };
    }
    if (ext === 'pptx') {
      await load('jszip');
      const zip = await root.JSZip.loadAsync(buf);
      const paths = Object.keys(zip.files).filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p)).sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10));
      const slides = [], parts = [];
      for (const p of paths) {
        const xml = await zip.file(p).async('string');
        const dec = (s) => new DOMParser().parseFromString('<x>' + s + '</x>', 'text/html').body.textContent;
        const title = (xml.match(/<p:ph type="(?:title|ctrTitle)"[\s\S]*?<\/p:sp>/) || [''])[0];
        const tRuns = [...title.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]).join(' ');
        const all = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]);
        slides.push(dec(tRuns || all[0] || '').trim());
        parts.push(dec(all.join(' ')));
      }
      const text = parts.join('\n').slice(0, MAX_TEXT);
      return { name, kind: 'PowerPoint', text, slides, periods: periodsOf(text), detail: slides.length + (slides.length === 1 ? ' slide' : ' slides') };
    }
    if (ext === 'pdf') {
      await load('pdf'); await load('pdfWorker'); // worker script runs on the main thread
      const doc = await root.pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
      const parts = [];
      for (let i = 1; i <= doc.numPages && parts.join(' ').length < MAX_TEXT; i++) parts.push((await (await doc.getPage(i)).getTextContent()).items.map((it) => it.str).join(' '));
      const text = parts.join('\n').slice(0, MAX_TEXT);
      return { name, kind: 'PDF', text, periods: periodsOf(text), detail: doc.numPages + (doc.numPages === 1 ? ' page' : ' pages') };
    }
    if (['doc', 'ppt'].includes(ext)) throw new Error('Older .' + ext + ' files can’t be read here. Save it as .' + ext + 'x and add it again.');
    throw new Error('This file type isn’t supported. Use Word, Excel, PowerPoint, PDF, CSV or text.');
  }

  root.ScopeFiles = { readFile, periodsOf };
})(typeof window !== 'undefined' ? window : globalThis);
