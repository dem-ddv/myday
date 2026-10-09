import { apiBase, onMyDay } from './api-config.js';

const dateText = iso => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`)).replace(/\sг\.$/, '');
const moscowDate = () => { const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(p => [p.type, p.value])); return `${parts.year}-${parts.month}-${parts.day}`; };
let currentRequest;

export function liveSleepPage() {
  const date = moscowDate();
  return `<main class="page live-sleep-page"><div class="content-shell"><section class="live-sleep-hero"><div class="eyebrow">ЛИЧНЫЕ ДАННЫЕ</div><h1>Мой сон</h1><p>Продолжительность сна за выбранный день</p></section><section class="live-sleep-card"><label for="sleep-date">Дата записи</label><input id="sleep-date" type="date" max="${date}" value="${date}" /><div id="live-sleep-result" role="status" aria-live="polite"><span class="live-sleep-state">Загружаем запись…</span></div><p class="live-sleep-source">Источник: Garmin через Intervals.icu</p></section><p class="live-sleep-note">На экранах «Обзор» и «Периоды» пока показаны примеры.</p></div></main>`;
}

export async function loadLiveSleep(date) {
  currentRequest?.abort();
  const controller = new AbortController();
  currentRequest = controller;
  const result = document.querySelector('#live-sleep-result');
  if (!result) return;
  result.replaceChildren();
  const state = document.createElement('span');
  state.className = 'live-sleep-state';
  state.textContent = 'Загружаем запись…';
  result.append(state);
  try {
    const response = await fetch(`${apiBase}/api/sleep?date=${encodeURIComponent(date)}`, { credentials: 'include', cache: 'no-store', signal: controller.signal });
    if (onMyDay && response.status === 403) { window.dispatchEvent(new Event('myday:session-expired')); return; }
    if (!response.ok) throw new Error(response.status === 403 ? 'access_denied' : 'source_unavailable');
    const data = await response.json();
    if (controller !== currentRequest || !result.isConnected) return;
    result.replaceChildren();
    const value = document.createElement('strong');
    value.className = 'live-sleep-value';
    value.textContent = data.state === 'recorded' && Number.isFinite(data.minutes) ? `${Math.floor(data.minutes / 60)} ч ${data.minutes % 60} мин` : 'Нет записи';
    const caption = document.createElement('span');
    caption.className = 'live-sleep-state';
    caption.textContent = data.state === 'recorded' ? `Сон за ${dateText(data.date)}` : `За ${dateText(data.date)} данных о сне нет`;
    result.append(value, caption);
  } catch (error) {
    if (error.name === 'AbortError' || controller !== currentRequest || !result.isConnected) return;
    state.textContent = error.message === 'access_denied' ? 'Вход не подтверждён. Обнови страницу и войди снова.' : 'Не удалось получить данные. Попробуй ещё раз позже.';
  }
}
