/* Practice book loader for the team demo (served by tools/team-demo.mjs as /demo-practice.js; never part of the distributable).
   Runs on the tracker page opened from the walkthrough (/practice). Fake data only, on this 127.0.0.1:8801 origin.
   - Empty book: loads the practice book (demo-seed.js) and a fake Gainsight send queue (3 items, one set to fail).
   - Book that already has data: asks first (confirm) and replaces nothing if you cancel.
   - Already the practice book (reload): changes nothing, so sent items stay sent.
   Finally points the tracker at the practice connector. */
(function () {
  const CONNECTOR = /*CONNECTOR*/null;
  const runSeed = () => (
/*SEED*/
  );
  const isPractice = () => DATA.customers.length > 0 && DATA.customers.every((c) => String(c.salesforceId || '').startsWith('001DEMO'));
  async function load() {
    for (let i = 0; i < 200 && !(typeof DATA !== 'undefined' && DATA && typeof saveData === 'function'); i++) await new Promise((r) => setTimeout(r, 50));
    if (typeof DATA === 'undefined' || !DATA) return;
    if (!isPractice()) {
      if (DATA.customers.length > 0 && !confirm('This tracker already has ' + DATA.customers.length + ' accounts. Replace them with the fake practice book? (Cancel keeps your book and leaves the practice connector off.)')) return;
      runSeed();
      const cust = DATA.customers.find((c) => c.gainsightId) || DATA.customers[0];
      const mk = (id, fields) => ({ id, date: todayISO(), customerId: cust.id, customerName: cust.name, kind: 'At-Risk CTA', payload: 'p ' + id, status: 'queued', fields, externalId: null, sentAt: null, error: null });
      DATA.gainsightQueue = [
        mk('demo-ok-1', { ctaName: 'Renewal at risk', reason: 'Sponsor left', severity: 'low' }),
        mk('demo-ok-2', { ctaName: 'Low usage', reason: 'No logins in 30 days', severity: 'low' }),
        mk('demo-bad', { ctaName: 'Contract question', reason: 'Legal review', severity: 'low', forceFail: true }),
      ];
      saveData();
    }
    saveConnectorSettings(CONNECTOR);
    await checkConnectorHealth();
    ui.view = 'today'; render();
  }
  window.addEventListener('load', () => { load().catch((e) => console.error('practice book: ' + (e && e.message || e))); });
})();
