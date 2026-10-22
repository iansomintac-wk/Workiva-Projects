(async () => {
  document.querySelectorAll('.modal-backdrop').forEach(m => m.remove());
  const find = () => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Backfill sessions');
  ui.view = 'today'; render();
  let b = find();
  if (!b) { ui.view = 'system'; render(); b = find(); }   // v13 puts Backfill sessions on the System screen
  if (!b) return 'FAIL: no Backfill sessions button';
  b.click(); await new Promise(r => setTimeout(r, 500));
  return 'backfill open';
})()
