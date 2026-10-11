import { today, days, selectDay, minutesText, numberText } from './data.js?v=e52f69a147ee';
import { renderPeriods } from './period-view.js?v=bdc75e187339';
import { liveWellnessPage, loadLiveWellness } from './live-sleep.js?v=d66495dd037c';
import { authenticated, onMyDay } from './api-config.js?v=d34637085ebe';

const app = document.querySelector('#app');
const state = { page: ['today','periods','sleep'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'today', mode: 'week', detail: null };
let detailReturn = null;
const dateFromISO = iso => new Date(`${iso}T12:00:00Z`);
const formatDate = (iso, options={ day:'numeric', month:'long', year:'numeric' }) => new Intl.DateTimeFormat('ru-RU', { timeZone:'UTC', ...options }).format(dateFromISO(iso)).replace(/\sг\.$/, '');
const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const goalBar = (value, goal, label) => Number.isFinite(value) ? `<span class="day-card-bar" role="progressbar" aria-valuenow="${Math.round(value)}" aria-valuemin="0" aria-valuemax="${goal}" aria-label="${label}"><i style="width:${Math.min(100,Math.max(0,value/goal*100))}%"></i></span>` : '';
function moscowDate() { const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone:'Europe/Moscow', year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(new Date()).map(p=>[p.type,p.value])); return `${parts.year}-${parts.month}-${parts.day}`; }
const overviewLabel = () => 'День';
const updatedLabel = () => today.updatedAt ? `Данные обновлены ${new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(today.updatedAt))}` : 'Время обновления неизвестно';
const icon = (name, size=24) => {
  const common = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;
  const paths = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
    layers: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    moon: '<path d="M20.5 14.1A8.5 8.5 0 0 1 9.9 3.5 8.6 8.6 0 1 0 20.5 14.1Z" fill="currentColor" stroke="none"/>',
    walk: '<circle cx="14" cy="3.5" r="1.8"/><path d="m12.5 6.5-2.7 5 3.1 2.2M10.9 8.6 6.5 11M11.6 8.1l3.5 2.7 3.3.4M12.9 13.7l-3.6 4.7-2.8 2.1M12.9 13.7l4.2 2.7 2.1 4.1"/>',
    food: '<path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v18M18 21V3c-4 2-5 7-5 11h5"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>', left: '<path d="m15 5-7 7 7 7"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    close: '<path d="M5 5 19 19M19 5 5 19"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
    weight: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M9 9a3 3 0 0 1 6 0l-3 2z"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  };
  return `<svg ${common}>${paths[name]}</svg>`;
};
const leaf = `<svg class="botanical" viewBox="0 0 188 210" fill="none" aria-hidden="true"><circle cx="60" cy="87" r="54" fill="#F7D8CB" opacity=".75"/><path d="M105 205C98 145 113 83 121 25" stroke="#60745E" stroke-width="2.2"/><path d="M117 69C89 46 88 21 90 8c24 6 34 27 27 61ZM113 111c23-33 46-34 59-32-6 25-27 39-59 32ZM101 148c-33-24-60-18-72-11 16 22 39 29 72 11ZM112 90c-2-30 15-52 26-60 10 22 1 44-26 60ZM104 172c24-22 48-21 60-17-13 23-35 28-60 17Z" fill="#8EA188" stroke="#63765E" stroke-width="1.3"/><path d="M92 9c11 20 17 40 25 60M171 80c-22 10-38 19-58 31M29 137c26 4 51 7 72 11M137 30c-12 21-19 39-25 60M163 155c-22 4-39 10-59 17" stroke="#697E66" stroke-width="1"/></svg>`;

function navItem(page, label, symbol) { return `<button class="nav-item ${state.page===page?'active':''}" data-page="${page}" aria-current="${state.page===page?'page':'false'}">${icon(symbol,22)}<span>${label}</span></button>`; }
function header() { return `<header class="topbar"><div class="topbar-inner"><a class="brand" href="#sleep"><span class="brand-leaf">✦</span><span>мой день</span></a><nav class="desktop-nav" aria-label="Основная навигация">${navItem('sleep','Мои данные','moon')}${navItem('today',overviewLabel(),'home')}${navItem('periods','Периоды','calendar')}</nav></div></header>`; }
function bottomNav() { return `<nav class="bottom-nav" aria-label="Основная навигация">${navItem('sleep','Мои данные','moon')}${navItem('today',overviewLabel(),'home')}${navItem('periods','Периоды','calendar')}</nav>`; }
function badge(text, tone='neutral') { return `<span class="badge ${tone}">${text}</span>`; }
function progress(value, color) { return `<div class="progress"><span style="width:${Math.min(100,value)}%;background:${color}"></span></div>`; }

function todayPage() {
  const nutrition = today.nutrition;
  const energy = today.energy;
  const weight = today.weight;
  const isCurrent = today.date === today.calendarToday;
  const earliest = days.length ? [...days].map(day=>day.date).sort()[0] : today.calendarToday;
  const previous = new Date(Date.parse(`${today.date}T12:00:00Z`)-86400000).toISOString().slice(0,10);
  const next = new Date(Date.parse(`${today.date}T12:00:00Z`)+86400000).toISOString().slice(0,10);
  const calories = Number.isFinite(nutrition?.calories) ? nutrition.calories : null;
  const insight = isCurrent ? today.insight?.recommendation : today.insight?.retrospective;
  return `<main class="page today-page"><div class="content-shell">
    <section class="day-head"><div><h1>День</h1><div class="day-date">${formatDate(today.date,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}${isCurrent?'<span class="today-chip">Сегодня</span>':''}</div></div><div class="day-switch" aria-label="Выбор дня"><button type="button" data-day="${previous}" aria-label="Предыдущий день" ${previous<earliest?'disabled':''}>${icon('left',19)}</button><input id="day-picker" type="date" value="${today.date}" min="${earliest}" max="${today.calendarToday}" aria-label="Выбрать день"><button type="button" data-day="${next}" aria-label="Следующий день" ${next>today.calendarToday?'disabled':''}>${icon('chevron',19)}</button></div></section>
    <div class="day-grid" aria-label="Показатели за ${formatDate(today.date)}">
      <button class="day-card sleep-card" data-detail="sleep"><span class="day-card-icon blue">${icon('moon',22)}</span><span class="day-card-title">Сон</span><strong class="day-card-value">${Number.isFinite(today.sleep)?minutesText(today.sleep):'—'}</strong>${goalBar(today.sleep,450,'Сон: из 7 часов 30 минут')}</button>
      <button class="day-card move-card" data-detail="movement"><span class="day-card-icon sage">${icon('walk',23)}</span><span class="day-card-title">Шаги</span><span class="day-card-subtitle">вне тренировок</span><strong class="day-card-value">${Number.isFinite(today.steps)?numberText(today.steps):'—'}</strong>${goalBar(today.steps,10400,'Шаги вне тренировок: из 10 400')}</button>
      <button class="day-card food-card" data-detail="nutrition"><span class="day-card-icon coral">${icon('food',22)}</span><span class="day-card-title">Съедено</span><strong class="day-card-value">${calories===null?'—':numberText(calories)} <small>ккал</small></strong>${goalBar(calories,2300,'Съедено: из 2300 ккал')}</button>
      <button class="day-card burn-card" data-detail="energy"><span class="day-card-icon green">${icon('sun',22)}</span><span class="day-card-title">Потрачено</span><strong class="day-card-value">${energy?`≈ ${numberText(energy.total)} <small>ккал</small>`:'—'}</strong>${goalBar(energy?.total,2000,'Потрачено: из 2000 ккал')}</button>
    </div>
    ${insight?.text ? `<section class="day-ai" aria-label="${isCurrent?'Рекомендация на день':'Анализ дня'}"><span class="day-ai-label">${isCurrent?'Сегодня':'Итог дня'}</span><p>${escapeHTML(insight.text)}</p></section>` : ''}
    <div class="day-meta"><span>${weight?`Вес ${weight.kg.toFixed(1).replace('.',',')} кг · замер ${formatDate(weight.measuredAt.slice(0,10),{day:'numeric',month:'short'})}`:'Данных о весе пока нет'}</span><span>${updatedLabel()}</span></div>
  </div></main>`;
}

function periodsPage() { return renderPeriods(state, icon); }

function detailContent(name) {
  const blocks = {
    sleep: { title:'Сон',symbol:'moon',tone:'blue',value:minutesText(today.sleep),description:'Ночной сон по записи Garmin.',rows:[['Вариабельность пульса',today.hrv == null ? 'Нет записи' : `${numberText(today.hrv)} мс`],['Пульс покоя',today.restingPulse == null ? 'Нет записи' : `${numberText(today.restingPulse)} уд/мин`]],source:'Garmin через Intervals.icu' },
    movement: { title:'Шаги',symbol:'walk',tone:'sage',value:numberText(today.steps),description:'Показаны шаги вне тренировок. Полоса сравнивает их с ориентиром 10 400 шагов за день; шаги на тренировках могут дополнять результат.',rows:[],source:'Garmin через Intervals.icu' },
    nutrition: { title:'Съедено',symbol:'food',tone:'coral',value:today.nutrition ? `${numberText(today.nutrition.calories)} ккал` : 'Нет записи',description:'Ориентир — 2300 ккал в день. Показаны только внесённые продукты; полнота дневника неизвестна.',rows:today.nutrition ? [['Белки',`${numberText(today.nutrition.protein)} г`],['Жиры',`${numberText(today.nutrition.fat)} г`],['Углеводы',`${numberText(today.nutrition.carbs)} г`],['Записей',numberText(today.nutrition.entries)]] : [],source:'FatSecret' },
    energy: { title:'Оценка расхода',symbol:'info',tone:'sage',value:today.energy ? `≈ ${numberText(today.energy.total)} ккал` : 'Нет оценки',description:`${today.date===today.calendarToday?'Оценка к текущему моменту дня.':'Оценка за завершённый день.'} Ориентир — 2000 ккал.`,rows:today.energy ? [['Основной обмен',`${numberText(today.energy.resting)} ккал`],['Фоновая активность',`${numberText(today.energy.background)} ккал`],['Тренировки',`${numberText(today.energy.workout)} ккал`],['Ходьба',`${numberText(today.energy.walking)} ккал`]] : [],source:'Расчёт по Garmin и Withings' },
  };
  const d=blocks[name];
  return `<div class="modal-backdrop" data-close="true"><section class="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title"><button class="modal-close" data-close="true" aria-label="Закрыть">${icon('close',20)}</button><span class="icon-orb ${d.tone}">${icon(d.symbol,25)}</span><h2 id="detail-title">${d.title}</h2><div class="detail-value">${d.value}</div><p>${d.description}</p><div class="detail-rows">${d.rows.map(([k,v])=>`<div><span>${k}</span><strong>${v}</strong></div>`).join('')}</div><div class="detail-updated">${updatedLabel()}</div><details class="detail-source"><summary>Об источнике</summary><p>${d.source}</p></details></section></div>`;
}

export function render() {
  if (!authenticated) return;
  app.innerHTML=`${header()}${state.page==='periods'?periodsPage():state.page==='sleep'?liveWellnessPage():todayPage()}${bottomNav()}${state.detail?detailContent(state.detail):''}`;
  document.body.classList.toggle('modal-open',!!state.detail);
  for(const element of app.querySelectorAll('.topbar, main, .bottom-nav')) element.toggleAttribute('inert',!!state.detail);
  if(state.detail) app.querySelector('.modal-close')?.focus();
  if(state.page==='sleep') loadLiveWellness(app.querySelector('#sleep-date').value);
}
function closeDetail() {
  const returnTo=detailReturn;
  state.detail=null;
  render();
  if(returnTo) app.querySelector(`[data-detail="${returnTo}"]`)?.focus();
}
app.addEventListener('click', e=>{
  const page=e.target.closest('[data-page]');
  if(page){state.page=page.dataset.page;state.detail=null;location.hash=state.page;window.scrollTo(0,0);render();return;}
  const day=e.target.closest('[data-day]');
  if(day && !day.disabled && selectDay(day.dataset.day)){state.page='today';state.detail=null;location.hash='today';window.scrollTo(0,0);render();return;}
  const detail=e.target.closest('[data-detail]');
  if(detail){detailReturn=detail.dataset.detail;state.detail=detail.dataset.detail;render();return;}
  if(e.target.matches('.modal-backdrop')||e.target.closest('.modal-close')){closeDetail();return;}
  const mode=e.target.closest('[data-mode]');
  if(mode){state.mode=mode.dataset.mode;render();return;}
});
app.addEventListener('change', e=>{if(e.target.id==='sleep-date') loadLiveWellness(e.target.value);if(e.target.id==='day-picker'&&selectDay(e.target.value))render();});
window.addEventListener('hashchange',()=>{const page=location.hash.slice(1);if(['today','periods','sleep'].includes(page)&&page!==state.page){state.page=page;state.detail=null;render();}});
window.addEventListener('keydown',e=>{
  if(!state.detail) return;
  if(e.key==='Escape'){closeDetail();return;}
  if(e.key!=='Tab') return;
  const focusable=[...app.querySelectorAll('.detail-modal button, .detail-modal summary')];
  const first=focusable[0],last=focusable.at(-1);
  if(e.shiftKey&&(document.activeElement===first||!focusable.includes(document.activeElement))){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&(document.activeElement===last||!focusable.includes(document.activeElement))){e.preventDefault();first.focus();}
});
render();
