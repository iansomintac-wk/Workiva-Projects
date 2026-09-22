(async () => {
  document.querySelectorAll('.modal-backdrop').forEach(m => m.remove());
  const T = todayISO(), D = isoAddDays;
  const q = v => /[,"]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  const lines = ['Account Name,Segment,Annual Contract Value,Contract End Date'].concat(
    __simRows.map(r => [r[0], r[6], '$' + r[7].toLocaleString('en-US'), D(T, r[8])].map(x => q(String(x))).join(',')));
  const inp = document.getElementById('import-values-input');
  const dt = new DataTransfer(); dt.items.add(new File([lines.join('\n')], 'gainsight-values.csv', { type: 'text/csv' }));
  inp.files = dt.files; inp.dispatchEvent(new Event('change', { bubbles: true }));
  await new Promise(r => setTimeout(r, 1500));
  const ms = [...document.querySelectorAll('.modal-backdrop')]; const m = ms[ms.length - 1];
  [...m.querySelectorAll('button')].find(b => /^Import/.test(b.innerText.trim())).click();
  await new Promise(r => setTimeout(r, 800));
  return 'values: ' + DATA.customers.filter(c => c.arr).length + ' with ARR';
})()
