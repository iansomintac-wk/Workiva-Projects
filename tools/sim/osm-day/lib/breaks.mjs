// Break table: one override per checked step (spec: the Breaks table in the plan).
// Each js is evaluated with Runtime.evaluate and ends with its own marker.
const m = id => `;window.__simBreak='${id}'`;
const B = (id, body) => ({ js: body + m(id) });

export const BREAKS = {
  D1: B('D1', `callsScheduledToday = () => []`),
  D2: B('D2', `renderBeatPrep = () => ''`),
  D3: B('D3', `{const o=renderBeatPanel; renderBeatPanel=(b,d)=>o(b,d).replace(/SIM-OWE[^<]*/g,'')}`),
  D4: B('D4', `{const o=commitDataCandidate; commitDataCandidate=d=>{Object.values(d.activities).flat().filter(a=>/SIM-D4/.test(a.summary||'')).forEach(a=>{delete a.transcript}); return o(d)}}`),
  D5: { ai: 'noEmail' },
  D6: B('D6', `{const o=saveData; saveData=()=>{DATA.customers.filter(c=>c.name==='Orion Semiconductor').forEach(c=>(c.commitments||[]).filter(x=>/^SIM-D6 /.test(x.text)).forEach(x=>{x.doneOn=null})); return o()}}`),
  D7: B('D7', `queueGainsightItem = () => true`),
  D8: B('D8', `markRiskActioned = () => {}`),
  D9: B('D9', `inImplementation = () => false`),
  D10: B('D10', `exportData = () => {}`),
  L1: B('L1', `{const o=saveData; saveData=()=>{DATA.customers=DATA.customers.filter(c=>c.name!=='Fernhollow Renewables'); return o()}}`),
  L2: B('L2', `setHandoffField = () => false`),
  L3: B('L3', `ACTIVITY_TYPES['Partner Sync']=['Log call summary in Gainsight timeline']`),
  L4: B('L4', `inImplementation = () => false`),
  L5: B('L5', `markImplementationGoLive = () => false`),
  L6: B('L6', `{computeCoverage = () => null; const o=todayActionList; todayActionList=(...a)=>o(...a).filter(r=>!/Fernhollow/.test(JSON.stringify(r))); const g=adminGapList; adminGapList=()=>g().map(x=>({...x,accounts:x.accounts.filter(c=>!/Fernhollow/.test(c.name))})).filter(x=>x.accounts.length)}`),
  L7: B('L7', `isPaused = () => false`),
  L8: B('L8', `classifyRiskText = () => []`),
  L9: B('L9', `toggleComplianceGate = () => false`),
  L10: B('L10', `isGraduatingSoon = () => false`),
  L11: B('L11', `{const o=openGraduationConfirmModal; openGraduationConfirmModal=(...a)=>{const r=o(...a); document.querySelectorAll('#gc-csat').forEach(e=>e.remove()); return r}}`),
  L12: B('L12', `csatSurveyOverdue = () => null`),
};

// Every global the overrides replace or the probe relies on; each must be `function <name>(` in both trackers.
export const OVERRIDE_NAMES = [
  'callsScheduledToday', 'renderBeatPrep', 'renderBeatPanel', 'commitDataCandidate', 'saveData',
  'queueGainsightItem', 'markRiskActioned', 'inImplementation', 'exportData', 'setHandoffField',
  'markImplementationGoLive', 'computeCoverage', 'todayActionList', 'isPaused', 'classifyRiskText',
  'toggleComplianceGate', 'adminGapList', 'isGraduatingSoon', 'validateGraduationDraft', 'parseOutstandingQuestions',
  'openGraduationConfirmModal',
];

// Override names that exist in 1.1 only (1.0 has no CSAT follow-up); checked against 1.1 alone.
export const OVERRIDE_NAMES_1_1_ONLY = ['csatSurveyOverdue'];
