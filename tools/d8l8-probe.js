/* 1.2 D8/L8 probe: clicking the last case on the Risk rail must bring it to the front, even when nothing
   sits below the deck to make up the scroll. Asynchronous, so it is not in the main suite:
     node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --seed demo-seed.js,tools/d8l8-probe.js --fn d8l8Probe --expect 5
   It hides whatever follows the track while it runs, and restores (saveData is stubbed so nothing persists): saveData, DATA.customers, DATA.activities, DATA.riskLog,
   ui.view, ui.riskFocusId, the scroll position. */
window.d8l8Probe = async function d8l8Probe(){
  const prevC = DATA.customers, prevA = DATA.activities, prevLog = DATA.riskLog, prevView = ui.view, prevFocus = ui.riskFocusId;
  const prevY = scrollY, hidden = [], realSave = saveData, extra = [];
  const reset = () => { _renderMemoResets.forEach(r => r()); _riskMemo = new Map(); _healthMemo = new Map(); };
  const frame = () => new Promise(r => requestAnimationFrame(() => r()));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let ok = false, detail = '';
  try{
    saveData = function(){ return true; };
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
      /* the track measures the page below it when it is sized (bind and resize), so tell it the page below has gone */
      dispatchEvent(new Event('resize'));
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

  /* the very bottom of the page, with the real page below the deck: the last case stays front and live */
  const bottomPart = async (n, label) => {
    let res = {ok: false, detail: ''};
    try{
      const mk2 = id => { const c = {id, name: 'D8L8 ' + id, module: DATA.config.modules[0], stage: DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200), totalSessions: 8, domainScores: {}, sessionNotes: {}, stageHistory: [], riskOverride: 'risk'}; backfillCustomerRecord(c); return c; };
      const cs2 = []; for(let i = 0; i < n; i++) cs2.push(mk2('__d8l8b_' + i));
      DATA.customers = cs2; DATA.activities = {}; DATA.riskLog = {};
      reset();
      buildRiskCases(buildRiskHubList()).forEach(k => setRiskVerdict(k.items[0], 'confirmed', 'short reason'));
      reset(); ui.view = 'risk'; ui.riskFocusId = null; render();
      await frame(); await frame();
      const track = document.querySelector('.rk3-track'), host = track && track.parentElement;
      if(!host || !host._deckCards || host._deckCards.length !== n || host.classList.contains('rk3--flat')){ res.detail = label + ' deck not bound: ' + JSON.stringify({n: host && host._deckCards ? host._deckCards.length : null}); return res; }
      const last = host._deckCards[n - 1];
      scrollTo(0, document.documentElement.scrollHeight); await sleep(400); await frame(); await frame();
      scrollTo(0, document.documentElement.scrollHeight); await sleep(300); await frame();
      const btns = [...last.querySelectorAll('button')].filter(b => b.offsetParent !== null);
      const hit = btns.filter(b => { const q = b.getBoundingClientRect(); if(q.width < 1 || q.bottom < 0 || q.top > innerHeight) return false; const e = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); return !!e && (e === b || b.contains(e)); }).length;
      const onScreen = btns.filter(b => { const q = b.getBoundingClientRect(); return q.height > 0 && q.bottom > 0 && q.top < innerHeight; }).length;
      const needed = host._deckOffsetFor(n - 1);
      const blank = track.offsetHeight - needed;
      const r = {n, behind: last.classList.contains('is-behind'), opacity: +getComputedStyle(last).opacity, pe: getComputedStyle(last).pointerEvents, onScreen, hit, blank, limit: innerHeight + last.scrollHeight, scrollY: Math.round(scrollY)};
      res.ok = !r.behind && r.opacity >= 0.99 && r.pe !== 'none' && onScreen > 0 && hit === onScreen && r.blank <= r.limit;
      res.detail = label + ' ' + JSON.stringify(r);
    }catch(e){ res.detail = label + ' threw: ' + e.message; }
    return res;
  };
  extra.push(['1.2 D8/L8 page scrolled to the very bottom: a single short case stays front with live buttons, no more blank than needed', await bottomPart(1, 'one card')]);
  extra.push(['1.2 D8/L8 page scrolled to the very bottom: the last of many cases stays front with live buttons, no more blank than needed', await bottomPart(14, 'many cards')]);
  hidden.forEach(h => { h[0].style.display = h[1]; });
  /* call 5: with the real page below the deck, the blank under the stage at the scroll where the last case arrives is small */
  let roomRes = {ok: false, detail: ''};
  try{
    const mkR = id => { const c = {id, name: 'D8L8 ' + id, module: DATA.config.modules[0], stage: DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200), totalSessions: 8, domainScores: {}, sessionNotes: {}, stageHistory: [], riskOverride: 'risk'}; backfillCustomerRecord(c); return c; };
    const csR = []; for(let i = 0; i < 14; i++) csR.push(mkR('__d8l8r_' + i));
    DATA.customers = csR; DATA.activities = {}; DATA.riskLog = {};
    reset();
    buildRiskCases(buildRiskHubList()).forEach(k => setRiskVerdict(k.items[0], 'confirmed', 'short reason'));
    reset(); ui.view = 'risk'; ui.riskFocusId = null; render(); await frame(); await frame();
    const trR = document.querySelector('.rk3-track'), hostR = trR && trR.parentElement, stR = trR && trR.querySelector('.rk3-stage');
    if(!stR || !hostR._deckCards) roomRes.detail = 'deck not bound';
    else {
      const arrive = trR.getBoundingClientRect().top + scrollY + hostR._deckOffsetFor(hostR._deckCards.length - 1);
      scrollTo(0, arrive); await sleep(500); await frame(); scrollTo(0, arrive); await sleep(300); await frame();
      const tb = trR.getBoundingClientRect(), sb = stR.getBoundingClientRect();
      const blank = Math.round(Math.min(tb.bottom, innerHeight) - sb.bottom), below = Math.round(document.documentElement.scrollHeight - (tb.bottom + scrollY));
      const lastR = hostR._deckCards[hostR._deckCards.length - 1];
      roomRes.ok = blank <= 32 && !lastR.classList.contains('is-behind') && Math.round(scrollY) >= Math.round(arrive) - 1;
      roomRes.detail = JSON.stringify({blank, below, vh: innerHeight, reached: Math.round(scrollY) >= Math.round(arrive) - 1, front: !lastR.classList.contains('is-behind')});
    }
  }catch(e){ roomRes.detail = 'threw: ' + e.message; }
  extra.push(['1.2 call 5 Deck blank room: with page content below, the blank under the stage where the last case arrives is at most 32px and the case is front', roomRes]);
  /* first paint after a jump: the last card, taller than the first card's cap, is drawn at its resting place (no stale offset) */
  let staleRes = {ok: false, detail: ''};
  try{
    const mkS = id => { const c = {id, name: 'D8L8 ' + id, module: DATA.config.modules[0], stage: DATA.config.stages[1].key, implementationDate: isoAddDays(todayISO(), -200), totalSessions: 8, domainScores: {}, sessionNotes: {}, stageHistory: [], riskOverride: 'risk'}; backfillCustomerRecord(c); return c; };
    const csS = []; for(let i = 0; i < 6; i++) csS.push(mkS('__d8l8s_' + i));
    DATA.customers = csS; DATA.activities = {}; DATA.riskLog = {};
    reset();
    buildRiskCases(buildRiskHubList()).forEach((k, i) => setRiskVerdict(k.items[0], 'confirmed', i === 0 ? 'short reason' : 'the sponsor said they may not renew and the budget owner has gone quiet. '.repeat(12)));
    reset(); ui.view = 'risk'; ui.riskFocusId = null; render(); await frame(); await frame();
    scrollTo(0, 0); await sleep(300); await frame();
    const trS = document.querySelector('.rk3-track'), hostS = trS && trS.parentElement, stS = trS && trS.querySelector('.rk3-stage');
    if(!stS || !hostS._deckCards) staleRes.detail = 'deck not bound';
    else {
      const lastS = hostS._deckCards[hostS._deckCards.length - 1];
      scrollTo({top: trS.getBoundingClientRect().top + scrollY + hostS._deckOffsetFor(hostS._deckCards.length - 1), behavior: 'instant'});
      await frame(); await frame();
      const m = /translate3d\(0px, ([-\d.]+)px/.exec(lastS.style.transform), ty = m ? +m[1] : NaN;
      const lb = lastS.getBoundingClientRect().bottom, sb = stS.getBoundingClientRect().bottom;
      staleRes.ok = ty === 0 && lb <= sb + 1;
      staleRes.detail = JSON.stringify({transform: lastS.style.transform, cardBottom: Math.round(lb), stageBottom: Math.round(sb), maxH: lastS.style.maxHeight});
    }
  }catch(e){ staleRes.detail = 'threw: ' + e.message; }
  extra.push(['1.2 deck first paint after a jump: the last case sits at translate 0 and inside the stage, not one paint stale', staleRes]);
  saveData = realSave; DATA.customers = prevC; DATA.activities = prevA; DATA.riskLog = prevLog; ui.view = prevView; ui.riskFocusId = prevFocus;
  reset(); render();
  scrollTo(0, prevY);
  return [{name: '1.2 D8/L8 the last case on the Risk rail comes to the front with nothing below the deck', ok, detail: ok ? '' : detail}]
    .concat(extra.map(e => ({name: e[0], ok: e[1].ok, detail: e[1].ok ? '' : e[1].detail})));
};
