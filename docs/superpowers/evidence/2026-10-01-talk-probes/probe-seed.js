window.probeFn = function(){
  const out = [];
  const add = (name, v) => out.push({name, ok:true, detail: JSON.stringify(v)});
  const book = JSON.parse(serializeBook(DATA));
  const c = book.customers[0];
  const cid = c.id;
  c.gainsight = {pulledAt:'x'};
  c.gainsightId = 'GS-1';
  c.zzUnknownCust = 'keepme?';
  const acts = book.activities[cid] || book.activities[Object.keys(book.activities)[0]];
  const aid = acts[0].id;
  acts[0].gong = {callId:'x'};
  acts[0].zzUnknownAct = 1;
  book.gainsightQueue = [{id:'q1', date: todayISO(), customerId: cid, customerName: c.name, kind:'At-Risk CTA', payload:'p', status:'sent', externalId:'E1', sentAt:'2026-01-01T00:00:00Z', error:'boom', zzq:1}];
  book.zzTopLevel = {a:1};
  const text = JSON.stringify(book);
  add('exported-json-has-keys', {gong: text.indexOf('"gong"')>=0, gainsight: text.indexOf('"pulledAt"')>=0});
  let prepared;
  try { prepared = prepareImportedData(JSON.parse(text)); } catch(e){ add('prepare threw', String(e.message)); return out; }
  const pc = prepared.customers.find(x=>x.id===cid);
  const pa = (prepared.activities[cid]||[]).find(x=>x.id===aid);
  add('customer', {gainsight: pc.gainsight, gainsightId: pc.gainsightId, zzUnknownCust: pc.zzUnknownCust});
  add('activity', {found: !!pa, gong: pa && pa.gong, zzUnknownAct: pa && pa.zzUnknownAct});
  add('queue', prepared.gainsightQueue);
  add('toplevel', {zzTopLevel: prepared.zzTopLevel});
  add('counts', {custs: prepared.customers.length, actKeys: Object.keys(prepared.activities).length});
  // archive path
  try {
    const arch = {customer: JSON.parse(JSON.stringify(c)), activities: acts, healthHistory: []};
    const pr = prepareArchiveData(arch);
    add('archive', {custGainsight: pr.customer.gainsight, custZz: pr.customer.zzUnknownCust, actGong: (pr.activities.find(x=>x.id===aid)||{}).gong});
  } catch(e){ add('archive threw', String(e.message)); }
  return out;
};
