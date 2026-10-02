/* Second seed, run AFTER demo-seed.js: turns the demo book into a USED book -- what the
   tracker holds after real connector use (Gong links on activities, Gainsight pull stamps on
   customers, a sent queue item with an externalId). The full self-check suite must still pass
   on it: a check that reads live DATA and breaks on legitimate connector-era data is fragile.
   node tools/selfcheck.mjs osm-book-of-business-tracker-1.0.html --seed demo-seed.js,docs/superpowers/evidence/trim-and-integration/used-book-seed.js --expect 459 */
(function(){
  const book = cloneData(DATA);
  const now = new Date().toISOString();
  book.customers.forEach((c, i) => {
    c.gainsight = {pulledAt: now, values: {tier: 'T' + (i + 1), arr: 100000 + i, renewalDate: "2027-01-01"}};
    const list = book.activities[c.id] || (book.activities[c.id] = []);
    list.push({id: 'used-g' + i, date: todayISO(), type: 'Call', summary: 'Real call ' + i, sessionNumber: null, checklist: [], flagged: false,
      gong: {callId: 'real-call-' + i, url: 'https://app.gong.example/call?id=' + i, matchedBy: 'gainsightId', summary: 'gs ' + i, participants: []}});
  });
  // a fixture call id the c3 checks use, already linked as after a real pull of that call
  const c0 = book.customers[0];
  book.activities[c0.id].push({id: 'used-fx1', date: todayISO(), type: 'Call', summary: 's', sessionNumber: 2, checklist: [], flagged: false,
    gong: {callId: 'c-demo-001', url: 'https://app.gong.example/call?id=c-demo-001', matchedBy: 'gainsightId', summary: 'x', participants: []}});
  book.gainsightQueue = (book.gainsightQueue || []).concat([{id: 'used-q1', date: todayISO(), customerId: c0.id, customerName: c0.name,
    kind: 'note', payload: 'sent note', status: 'sent', fields: {}, externalId: 'GS-NOTE-1', sentAt: now, error: null},
    {id: 'used-q2', date: todayISO(), customerId: c0.id, customerName: c0.name, kind: 'note', payload: 'failed note', status: 'failed', fields: {}, externalId: null, sentAt: null, error: 'boom'},
    {id: 'used-q3', date: todayISO(), customerId: c0.id, customerName: c0.name, kind: 'note', payload: 'waiting', status: 'queued', fields: {}, externalId: null, sentAt: null, error: null}]);
  const candidate = prepareBookData(book, 'used-book seed');
  commitDataCandidate(candidate);
  render();
})()
