import { apiBase, onMyDay } from './api-config.js?v=1dc4bd0bd20b';

const dateText = iso => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`)).replace(/\sг\.$/, '');
const moscowDate = () => { const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(p => [p.type, p.value])); return `${parts.year}-${parts.month}-${parts.day}`; };
const previousDate = iso => new Date(Date.parse(`${iso}T00:00:00Z`) - 86400000).toISOString().slice(0, 10);
let currentRequest;

const metrics = [
  { key: 'sleepMinutes', label: 'Сон', unit: 'ч:мин', format: value => `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}` },
  { key: 'steps', label: 'Шаги', unit: 'за день', format: value => Math.round(value).toLocaleString('ru-RU') },
  { key: 'hrvMs', label: 'Вариабельность пульса', unit: 'мс · rMSSD', format: value => Math.round(value).toLocaleString('ru-RU') },
  { key: 'restingPulse', label: 'Пульс покоя', unit: 'уд/мин', format: value => Math.round(value).toLocaleString('ru-RU') },
];

export function liveWellnessPage() {
  const today = moscowDate();
  return `<main class="page live-sleep-page"><div class="content-shell"><section class="live-sleep-hero"><div class="eyebrow">ЛИЧНЫЕ ДАННЫЕ</div><h1>Мои данные</h1><p>Показатели Garmin за выбранный день</p></section><section class="live-sleep-card"><label for="sleep-date">Дата записи</label><input id="sleep-date" type="date" max="${today}" value="${previousDate(today)}" /><p id="live-wellness-status" class="live-sleep-state" role="status" aria-live="polite">Загружаем записи…</p><div class="live-wellness-grid" aria-busy="true">${metrics.map(metric => `<div class="live-wellness-metric" data-metric="${metric.key}"><span class="live-wellness-label">${metric.label}</span><strong class="live-wellness-value">—</strong><span class="live-wellness-unit">${metric.unit}</span></div>`).join('')}</div><p class="live-sleep-source">Источник: Garmin через Intervals.icu. По умолчанию показан вчерашний завершённый день; можно выбрать сегодня. Пропуск означает, что запись не получена.</p></section><p class="live-sleep-note">«День» и «Периоды» показывают сохранённые личные записи.</p></div></main>`;
}

export async function loadLiveWellness(date) {
  currentRequest?.abort();
  const controller = new AbortController();
  currentRequest = controller;
  const status = document.querySelector('#live-wellness-status');
  const grid = document.querySelector('.live-wellness-grid');
  if (!status || !grid) return;
  status.textContent = 'Загружаем записи…';
  grid.setAttribute('aria-busy', 'true');
  for (const metric of metrics) grid.querySelector(`[data-metric="${metric.key}"] .live-wellness-value`).textContent = '—';
  try {
    const response = await fetch(`${apiBase}/api/wellness?date=${encodeURIComponent(date)}`, { credentials: 'include', cache: 'no-store', signal: controller.signal });
    if (onMyDay && response.status === 403) { window.dispatchEvent(new Event('myday:session-expired')); return; }
    if (!response.ok) throw new Error(response.status === 403 ? 'access_denied' : 'source_unavailable');
    const data = await response.json();
    if (controller !== currentRequest || !grid.isConnected) return;
    for (const metric of metrics) {
      const value = data[metric.key];
      grid.querySelector(`[data-metric="${metric.key}"] .live-wellness-value`).textContent = Number.isFinite(value) ? metric.format(value) : 'Нет записи';
    }
    status.textContent = data.state === 'missing' ? `За ${dateText(data.date)} записей нет` : `Данные за ${dateText(data.date)}${date === moscowDate() ? ' · день ещё идёт' : ''}`;
  } catch (error) {
    if (error.name === 'AbortError' || controller !== currentRequest || !grid.isConnected) return;
    status.textContent = error.message === 'access_denied' ? 'Вход не подтверждён. Обнови страницу и войди снова.' : 'Не удалось получить данные. Попробуй ещё раз позже.';
  } finally {
    if (controller === currentRequest && grid.isConnected) grid.setAttribute('aria-busy', 'false');
  }
}
