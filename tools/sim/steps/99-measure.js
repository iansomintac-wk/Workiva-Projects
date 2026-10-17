(() => {
  // The field-test baseline. Each fix spec names the metric it must move.
  const T = todayISO();
  const byName = n => DATA.customers.find(c => c.name === n);
  const out = {};

  // FIX 1 — risk signals raised by the tool's own backfill note text
  const hub = buildRiskHubList();
  const bf = hub.filter(h => h.kind === 'Category signal' && /backfill/i.test(JSON.stringify(h)));
  out.fix1_backfillFalseRisks = bf.length;
  out.fix1_riskSignalsTotal = hub.length;
  out.fix1_backfillInHandoffPacket = /matched "backfill"/.test(buildKnowledgeTransferText(byName('Aurora Renewables')));

  // FIX 2 — the ghosting account (38 days of customer silence, 2 unanswered emails)
  const cw = byName('Coastal Water Authority');
  out.fix2_coastalState = computeRisk(cw);
  out.fix2_coastalReasons = hub.filter(h => h.c && h.c.id === cw.id).map(h => h.kind);

  // FIX 3 — does "Copy for Gainsight" carry the call note just logged?
  const orion = byName('Orion Semiconductor');
  const note = (window.__orionNote || '').slice(0, 60);
  const items = pendingGainsightItems().filter(i => i.customerId === orion.id);
  out.fix3_copyTextHasCallNote = !!note && buildGainsightCopyText(orion).includes(note);
  out.fix3_batchTextHasCallNote = !!note && buildGainsightBatchText(orion, items).includes(note);

  // FIX 4 — "Schedule Session N" advice on accounts whose next session is already booked
  ui.view = 'today'; ui.openCustomerId = null; render();
  const txt = document.getElementById('app').innerText;
  const beats = txt.split(/\n\d+ OF \d+ · [^\n]*\n/).slice(1).map(b => b.split('\n'));
  const sched = beats.filter(b => b.slice(0, 12).some(l => /^Schedule Session \d/.test(l)));
  out.fix4_scheduleAdviceBeats = sched.length;
  out.fix4_scheduleAdviceButBooked = sched.filter(b => { const c = byName(b[0]); return c && c.nextSessionScheduledOn && c.nextSessionScheduledOn >= T; }).length;
  out.fix4_rankedBeats = beats.length;

  // Context — the other findings in the field test
  const comp = pendingGainsightItems().filter(i => i.kind === 'compliance');
  out.ctx_gainsightPending = pendingGainsightItems().length;
  out.ctx_complianceOnKickoff = comp.filter(i => (DATA.customers.find(c => c.id === i.customerId) || {}).stage === 'kickoff').length;
  out.ctx_gradDateChangeItems = pendingGainsightItems().filter(i => i.kind === 'grad-review').length;
  out.ctx_status = ['risk', 'watch', 'ontrack'].map(s => s + ':' + DATA.customers.filter(c => computeRisk(c) === s).length).join(' ');
  return out;
})()
