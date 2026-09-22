(async () => {
  document.querySelectorAll('.modal-backdrop').forEach(m => m.remove());
  ui.view = 'today'; render();
  const b = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Backfill sessions');
  if (!b) return 'FAIL: no Backfill sessions button';
  b.click(); await new Promise(r => setTimeout(r, 500));
  return 'backfill open';
})()
