// Personal observations arrive only from the authenticated dashboard API.
export const today = { date: '', sleep: null, steps: null, hrv: null, restingPulse: null, nutrition: null, energy: null, weight: null, updatedAt: '' };
export let days = [];

export function moscowDate(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function setDashboard(payload, now = new Date()) {
  days = Array.isArray(payload.days) ? payload.days : [];
  today.date = moscowDate(now);
  const row = days.find(day => day.date === today.date) ?? {};
  for (const field of ['sleep', 'steps', 'hrv', 'restingPulse', 'nutrition', 'energy']) today[field] = row[field] ?? null;
  today.weight = [...days].reverse().find(day => day.date <= today.date && day.weight)?.weight ?? null;
  today.updatedAt = payload.updatedAt ?? '';
}

export function average(values) { const valid = values.filter(Number.isFinite); return valid.length ? valid.reduce((a,b) => a+b, 0) / valid.length : null; }
export function minutesText(n) { return Number.isFinite(n) ? `${Math.floor(n/60)} ч ${Math.round(n%60)} м` : 'Нет записи'; }
export function numberText(n) { return Number.isFinite(n) ? Math.round(n).toLocaleString('ru-RU') : 'Нет записи'; }
