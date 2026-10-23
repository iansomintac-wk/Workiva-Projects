// Time-proof fake data: shift fixture dates by whole days so the newest lands LAG_DAYS before today (the LOCAL calendar day, the same day the tracker's todayISO() uses).
const DAY = 86400000;
export const LAG_DAYS = 1;

function utcDay(ms) { return Math.floor(ms / DAY); }
// Day number of the local calendar date of `ms` (so 17:30 PDT is still that evening's date, not tomorrow's UTC date).
function localDay(ms) { return Math.floor((ms - new Date(ms).getTimezoneOffset() * 60000) / DAY); }

export function resolveNow(now, env = process.env) {
  let v = now;
  if (v === undefined && env.CONNECTOR_FAKE_NOW) v = Date.parse(env.CONNECTOR_FAKE_NOW);
  if (typeof v === 'function') v = v();
  if (v === undefined || v === null) v = Date.now();
  return v instanceof Date ? v.getTime() : Number(v);
}

export function rebaseDays(anchorISODate, now) {
  const anchor = utcDay(Date.parse(String(anchorISODate).slice(0, 10)));
  return localDay(resolveNow(now)) - anchor - LAG_DAYS;
}

export function shiftISO(iso, days) {
  const s = String(iso);
  if (!s) return s;
  const day = new Date(Date.parse(s.slice(0, 10)) + days * DAY).toISOString().slice(0, 10);
  return day + s.slice(10);
}
