/* 1.2 D8/L8 probe: clicking the last case on the Risk rail must bring it to the front, even when nothing
   sits below the deck to make up the scroll. Asynchronous, so it is not in the main suite:
     node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js,tools/d8l8-probe.js --fn d8l8Probe --expect 1
   It hides whatever follows the track while it runs, and restores: DATA.customers, DATA.activities, DATA.riskLog,
   ui.view, ui.riskFocusId, the scroll position. */
window.d8l8Probe = async function d8l8Probe(){
  const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog, prevView = ui.view, prevFocus = ui.riskFocusId;
  const prevY = scrollY, hidden = [];
  const reset = () => { _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map(); };
  const frame = () => new Promise(r => requestAnimationFrame(() => r()));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let ok = false, detail = '';
  try{
    const mk = id => { const c = {id, name: 'D8L8 ' + id, module: DATA.config.modules[0], stage: DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200), totalSessions: 8, domainScores: {}, sessionNotes: {}, stageHistory: [], riskOverride: 'risk'}; backfillCustomerRecord(c); return c; };
    const cs = []; for(let i = 0; i < 14; i++) cs.push(mk('__d8l8_' + i));
    DATA.customers = cs; DATA.activities = {}; DATA.riskLog = {};
    reset();
    const cases = buildRiskCases(buildRiskHubList());
    cases.forEach(k => setRiskVerdict(k.items[0], 'confirmed', 'short reason'));
    reset(); ui.view = 'risk'; ui.riskFocusId = null; render();
    await frame(); await frame();
    const track = document.querySelector('.rk3-track'), host = track && track.parentElement;
    if(!host || typeof host._deckOffsetFor !== 'function' || !host._deckCards || host._deckCards.length !== 14 || host.classList.contains('rk3--flat')){
      detail = 'deck not bound: ' + JSON.stringify({track: !!track, n: host && host._deckCards ? host._deckCards.length : null});
    } else {
      /* no page below the deck: the track alone must make the last case reachable */
      for(let n = track; n && n !== document.documentElement; n = n.parentElement){
        for(let s = n.nextElementSibling; s; s = s.nextElementSibling){ hidden.push([s, s.style.display]); s.style.display = 'none'; }
      }
      await frame();
      const lastCard = host._deckCards[host._deckCards.length - 1], lastId = lastCard.dataset.riskCase;
      const btn = document.querySelector('[data-spine-to="rk-c-' + lastId + '"]');
      if(!btn) detail = 'no rail button for the last case';
      else {
        btn.click();
        let prev = null, same = 0; const t0 = Date.now();
        while(Date.now() - t0 < 4000){
          await sleep(100);
          const k = scrollY + '|' + document.getAnimations().length;
          same = k === prev ? same + 1 : 0; prev = k;
          if(same >= 3 && document.getAnimations().length === 0) break;
        }
        await sleep(300);
        const vis = host._deckCards.filter(c => !c.classList.contains('is-behind') && +getComputedStyle(c).opacity > 0.02).length;
        const r = {focus: ui.riskFocusId === lastId, behind: lastCard.classList.contains('is-behind'), opacity: +getComputedStyle(lastCard).opacity, visible: vis, scrollY: Math.round(scrollY), maxScroll: document.documentElement.scrollHeight - innerHeight, innerHeight};
        ok = r.focus && !r.behind && r.opacity >= 0.99 && r.visible === 1;
        detail = JSON.stringify(r);
      }
    }
  }catch(e){ detail = 'threw: ' + e.message; }
  hidden.forEach(h => { h[0].style.display = h[1]; });
  DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog; ui.view = prevView; ui.riskFocusId = prevFocus;
  reset(); render();
  scrollTo(0, prevY);
  return [{name: '1.2 D8/L8 the last case on the Risk rail comes to the front with nothing below the deck', ok, detail: ok ? '' : detail}];
};
