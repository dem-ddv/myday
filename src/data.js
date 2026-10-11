// Personal observations arrive only from the authenticated dashboard API.
export const today = { date: '', calendarToday: '', sleep: null, steps: null, hrv: null, restingPulse: null, nutrition: null, energy: null, weight: null, insight: null, updatedAt: '' };
export let days = [];

export function moscowDate(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function setDashboard(payload, now = new Date()) {
  days = Array.isArray(payload.days) ? payload.days : [];
  const previousCalendarToday = today.calendarToday;
  today.calendarToday = moscowDate(now);
  selectDay(previousCalendarToday === today.calendarToday && today.date <= today.calendarToday ? today.date : today.calendarToday);
  today.updatedAt = payload.updatedAt ?? '';
}

export function selectDay(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || key > today.calendarToday || Number.isNaN(Date.parse(`${key}T12:00:00Z`))) return false;
  today.date = key;
  const row = days.find(day => day.date === key) ?? {};
  for (const field of ['sleep', 'steps', 'hrv', 'restingPulse', 'nutrition', 'energy', 'insight']) today[field] = row[field] ?? null;
  today.weight = days.filter(day => day.date <= key && day.weight).sort((a,b) => b.date.localeCompare(a.date))[0]?.weight ?? null;
  return true;
}

export function average(values) { const valid = values.filter(Number.isFinite); return valid.length ? valid.reduce((a,b) => a+b, 0) / valid.length : null; }
export function minutesText(n) { return Number.isFinite(n) ? `${Math.floor(n/60)} ч ${Math.round(n%60)} м` : 'Нет записи'; }
export function numberText(n) { return Number.isFinite(n) ? Math.round(n).toLocaleString('ru-RU') : 'Нет записи'; }
