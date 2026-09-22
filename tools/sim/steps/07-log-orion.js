(async () => {
  // Work the 10:00 call: log session 8 from the account's log form, then close the promise kept on the call.
  const c = DATA.customers.find(x => x.name === 'Orion Semiconductor');
  ui.view = 'today'; ui.openCustomerId = c.id; ui.panelTab = 'log'; render();
  await new Promise(r => setTimeout(r, 400));
  const set = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
  const sum = document.getElementById('act-summary'); if (!sum) return 'FAIL: no #act-summary';
  set(sum, window.__orionNote = 'Session 8: walked Priya\'s team through workpaper planning and fieldwork. Sent the deficiency-field mapping doc live on the call; they accepted it. Priya still owes Q3 walkthrough owners. Open question: can deficiency severity roll up to the audit committee report automatically? Next: final review cycle, then graduation readiness.');
  [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Log activity').click();
  await new Promise(r => setTimeout(r, 800));
  const k = c.commitments.find(x => /mapping doc/.test(x.text)); k.doneOn = todayISO(); saveData();
  ui.openCustomerId = null; ui.view = 'today'; render();
  const last = DATA.activities[c.id].slice(-1)[0];
  return 'logged session ' + last.sessionNumber + '; promise closed';
})()
