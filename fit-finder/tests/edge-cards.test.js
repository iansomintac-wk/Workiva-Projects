/* node tests/edge-cards.test.js
   Hand-written edge inputs for five card problems, each with controls that keep their current card (or none).
   first = the card that must lead ('none' = no card); not = cards that must not appear. */
const path = require('path');
const F = require('../engine/fit.js');
const cat = require('../data/catalogue.json');
const cases = [
  // 1 sustainability card needs a sustainability cue
  { t: 'Explain the new lease accounting standard', first: 'none' },
  { t: 'Explain the new revenue standard to the board', first: 'none' },
  { t: 'Explain the new CSRD requirements to the team', first: 'sus-requirements' },
  { t: 'Explain the ESRS E1 standard', first: 'sus-requirements' },
  { t: 'For our climate disclosures, explain what the new requirements mean', first: 'sus-requirements' },
  { t: 'Explain the TCFD requirements', first: 'sus-requirements' },
  // 2 a translate ask leads with the translate card
  { t: 'Translate the sustainability report into Spanish', first: 'gen-translate' },
  { t: 'Translate the climate disclosure into German', first: 'gen-translate' },
  { t: 'Translate the contract into French', first: 'gen-translate' },
  { t: 'Rewrite the sustainability narrative for the board', first: 'sus-exec-narrative' },
  // 3 an op word after a negation does not count
  { t: 'Do not summarize anything, just file it', first: 'none' },
  { t: "Don't summarize the minutes, I only need them filed", first: 'none' },
  { t: 'Summarize the audit committee minutes', first: 'gen-summarize-file' },
  { t: 'Summarize the long report before the meeting', first: 'gen-summarize-file' },
  // 4 reviewing an assurance report and listing exceptions reaches the file-summary card
  { t: 'Review the SOC 1 report and list the exceptions', first: 'gen-summarize-file' },
  { t: 'Review the SOC 2 report and list the findings', first: 'gen-summarize-file' },
  { t: 'Read the vendor contract and tell me what it is about', first: 'none' },
  { t: 'Check the memo for typos', first: 'none' },
  // 5 tone words stay out of REWRITE (rule C, 2026-10-17, locked in catalogue.test.js): only these controls are pinned here
  { t: 'Rewrite the board memo to be shorter', first: 'gen-rewrite' },
  { t: 'Make this memo more concise', first: 'none' },
  { t: 'Make the budget more accurate', first: 'none' },
  // 6 a translate verb with "into/to <language>" leads with the translate card wherever the sustainability word sits (fix B)
  { t: 'Translate the entire annual report for all our international investors including sustainability disclosures into Spanish', first: 'gen-translate' },
  { t: 'Translate the board pack for our regional teams, including the ESG disclosures, to German', first: 'gen-translate' },
  { t: 'Translate everything we publish for our overseas customers and partners about climate targets into Japanese', first: 'gen-translate' },
  { t: 'Rewrite the sustainability narrative for the board', first: 'sus-exec-narrative' },
  // 7 a "never"/"without" inside a relative clause is not an instruction, so the verb after it still counts (fix B): ops must include the named op
  { t: 'List the bank accounts that never reconcile each month', ops: 'CHECK' },
  { t: 'List the invoices that never match the purchase order', ops: 'CHECK' },
  { t: 'Show me the entities that are without a signed policy and flag them', ops: 'CHECK' },
  { t: 'Never summarize the minutes, just file them', first: 'none' }
];
let bad = 0;
for (const c of cases) {
  if (c.ops) {
    const r = F.rate(c.t);
    if (!r.ops.includes(c.ops)) { bad++; console.log(`FAIL ${c.t} -> ops [${r.ops}] (want ${c.ops})`); }
    continue;
  }
  const got = F.match(c.t, cat, 3).map((u) => u.id)[0] || 'none';
  if (got !== c.first) { bad++; console.log(`FAIL ${c.t} -> ${got} (want ${c.first})`); }
}
console.log(bad ? `${bad} of ${cases.length} edge cases fail` : `edge cards pass (${cases.length})`);
process.exit(bad ? 1 : 0);
