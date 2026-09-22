(async () => {
  const T = todayISO(), D = isoAddDays;
  const wk = iso => { const d = new Date(iso + 'T12:00:00'); const w = d.getDay(); return w === 6 ? D(iso, 2) : w === 0 ? D(iso, 1) : iso; };
  // name: [completed, lastSessionDaysAgo, nextBookedInDays|null]
  const plan = {
    'Halcyon Biotherapeutics':[3,8,6], 'Stonebridge Regional Bancorp':[6,10,8], 'Cascade Timber Holdings':[1,12,2],
    'Meridian Freight Partners':[4,6,7], 'Orion Semiconductor':[7,5,0], 'Bluewater Utilities':[4,17,9],
    'Pioneer Mutual Insurance':[1,9,5], 'Tidewater Hospitality Group':[3,11,3], 'Northwind Agritech':[6,7,3],
    'Keystone Medical Devices':[4,4,0], 'Aurora Renewables':[8,12,null], 'Granite State Credit Union':[7,13,1],
    'Lakeshore Consumer Brands':[3,13,8], 'Vantage Aerospace':[1,20,1], 'Redwood Capital REIT':[2,9,10],
    'Sable Creek Energy':[1,15,0], 'Brightline Staffing':[3,26,null], 'Evergreen Packaging Co':[6,14,1],
    'Summit Health Partners':[8,20,null], 'Coastal Water Authority':[3,38,null], 'Ironclad Logistics':[4,22,null],
    'Pinnacle Foods International':[6,9,2], 'Crestview Bank':[0,null,6], 'Solaris Chemicals':[5,18,null],
    'Harbor Point Retail':[2,11,7], 'Atlas Mining Group':[4,16,9], 'Quantum Payments':[3,5,8]
  };
  const ms = [...document.querySelectorAll('.modal-backdrop')]; const m = ms[ms.length - 1];
  const set = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
  let filled = 0, skipped = [];
  m.querySelectorAll('[data-bf-completed]').forEach(inp => {
    const name = inp.getAttribute('aria-label').replace('Sessions completed for ', '');
    const p = plan[name]; if (!p) { skipped.push(name); return; }
    const row = inp.closest('tr') || inp.parentElement.parentElement;
    set(inp, String(p[0])); filled++;
    if (p[1] != null) { set(row.querySelector('[data-bf-last]'), D(T, -p[1])); filled++; }
    if (p[2] != null) { set(row.querySelector('[data-bf-booked]'), wk(D(T, p[2]))); filled++; }
  });
  [...m.querySelectorAll('button')].find(b => b.innerText.trim() === 'Save backfill').click();
  await new Promise(r => setTimeout(r, 800));
  const toast = [...document.querySelectorAll('[class*=toast]')].map(t => t.innerText).join(' | ');
  const c = DATA.customers;
  return { fieldsFilled: filled, skipped, toast, modalsLeft: document.querySelectorAll('.modal-backdrop').length,
    status: ['risk', 'watch', 'ontrack'].map(s => s + ':' + c.filter(x => computeRisk(x) === s).length).join(' '),
    dayOfWeek: new Date(T + 'T12:00').toDateString() };
})()
