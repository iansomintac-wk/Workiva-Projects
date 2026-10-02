#!/usr/bin/env node
// Counts whole-word occurrences of symbols in a file after stripping comments.
//   node tools/refcount.mjs <file> <sym>[,<sym>...]
// Prints "<sym>: <n>" per symbol. Exit 0 always. Dev tooling (K2/K3 measurement), not shipped.
// Stripped: <!-- -->, /* */, and // to end of line. String-aware enough for the tracker:
// '//' inside quotes or template literals is kept, and so is '://' anywhere.
import { readFileSync } from 'node:fs';

export function stripComments(src) {
  let out = '', i = 0, quote = null;
  const n = src.length;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (quote) {
      // Resync: a regex literal holding a quote or backtick can desync the string state. A column-0
      // `function` or a banner comment can never sit inside a string/template in this file, so reset there.
      if (c === '\n' && (src.startsWith('\nfunction ', i) || src.startsWith('\nasync function ', i) || src.startsWith('\n/* ====', i))) quote = null;
      out += c;
      if (c === '\\') { out += d ?? ''; i += 2; continue; }
      if (c === quote) quote = null;
      else if (c === '\n' && quote !== '`') quote = null; // unterminated ' or " (e.g. an apostrophe in HTML text)
      i++; continue;
    }
    if (c === '<' && src.startsWith('<!--', i)) {
      const e = src.indexOf('-->', i + 4);
      i = e === -1 ? n : e + 3; continue;
    }
    if (c === '/' && d === '*') {
      const e = src.indexOf('*/', i + 2);
      i = e === -1 ? n : e + 2; continue;
    }
    if (c === '/' && d === '/' && src[i - 1] !== ':') {
      while (i < n && src[i] !== '\n') i++;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') quote = c;
    out += c; i++;
  }
  return out;
}

export function refcount(src, sym) {
  const esc = sym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = stripComments(src).match(new RegExp('(?<![\\w$])' + esc + '(?![\\w$])', 'g'));
  return m ? m.length : 0;
}

if (process.argv[1] && process.argv[1].endsWith('refcount.mjs')) {
  const [file, syms] = process.argv.slice(2);
  if (!file || !syms) { console.error('usage: node tools/refcount.mjs <file> <sym>[,<sym>...]'); process.exit(0); }
  const src = readFileSync(file, 'utf8');
  for (const s of syms.split(',').filter(Boolean)) console.log(`${s}: ${refcount(src, s)}`);
}
