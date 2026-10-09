import { today, minutesText, numberText } from './data.js';
import { renderPeriods } from './period-view.js';
import { periodWindow, mean } from './period-model.js';
import { liveWellnessPage, loadLiveWellness } from './live-sleep.js';
import { authenticated, onMyDay } from './api-config.js';

const app = document.querySelector('#app');
const state = { page: ['today','periods','sleep'].includes(location.hash.slice(1)) ? location.hash.slice(1) : onMyDay ? 'sleep' : 'today', mode: 'week', detail: null };
let detailReturn = null;
const dateFromISO = iso => new Date(`${iso}T12:00:00Z`);
const formatDate = (iso, options={ day:'numeric', month:'long', year:'numeric' }) => new Intl.DateTimeFormat('ru-RU', { timeZone:'UTC', ...options }).format(dateFromISO(iso)).replace(/\sг\.$/, '');
function moscowDate() { const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone:'Europe/Moscow', year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(new Date()).map(p=>[p.type,p.value])); return `${parts.year}-${parts.month}-${parts.day}`; }
const isCurrentDay = () => today.date === moscowDate();
const overviewLabel = () => 'Пример дня';
const updatedLabel = time => `Обновлено ${isCurrentDay()?'сегодня':formatDate(today.date,{day:'numeric',month:'long'})}, ${time}`;
const periodWeightDate = (period, index) => formatDate(`${period.key}-${String(index+1).padStart(2,'0')}`, { day:'numeric', month:'long' });
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
function header() { return `<header class="topbar"><div class="topbar-inner"><a class="brand" href="#sleep"><span class="brand-leaf">✦</span><span>мой день</span></a><nav class="desktop-nav" aria-label="Основная навигация">${navItem('sleep','Мои данные','moon')}${navItem('today',overviewLabel(),'home')}${navItem('periods','Периоды · пример','calendar')}</nav></div></header>`; }
function bottomNav() { return `<nav class="bottom-nav" aria-label="Основная навигация">${navItem('sleep','Мои данные','moon')}${navItem('today',overviewLabel(),'home')}${navItem('periods','Периоды','calendar')}</nav>`; }
function badge(text, tone='neutral') { return `<span class="badge ${tone}">${text}</span>`; }
function progress(value, color) { return `<div class="progress"><span style="width:${Math.min(100,value)}%;background:${color}"></span></div>`; }

function todayPage() {
  return `<main class="page today-page"><div class="content-shell">
    <section class="hero"><div class="hero-copy"><div class="eyebrow">ВЫМЫШЛЕННЫЕ ДАННЫЕ · ${formatDate(today.date,{weekday:'long',day:'numeric',month:'long',year:'numeric'}).toUpperCase()}</div><h1>${overviewLabel()}</h1></div><div class="hero-art">${leaf}</div></section>
    <div class="today-layout"><div class="main-column"><div class="section-heading"><h2>Главное за день</h2></div>
      <div class="metric-grid">
        <button class="metric-card sleep-card" data-detail="sleep"><div class="card-top"><span class="icon-orb blue">${icon('moon',25)}</span><span class="card-arrow">${icon('chevron',22)}</span></div><h3>Сон</h3><div class="metric-value">${minutesText(today.sleep.minutes)}</div><p class="metric-note">На ${today.sleep.targetMinutes-today.sleep.minutes} мин меньше ориентира ${minutesText(today.sleep.targetMinutes).replace(/ 0 м$/,'')}</p>${progress(today.sleep.minutes/today.sleep.targetMinutes*100,'#6683AC')}<div class="card-foot">${updatedLabel(today.sleep.updated)}</div></button>
        <button class="metric-card move-card" data-detail="movement"><div class="card-top"><span class="icon-orb sage">${icon('walk',27)}</span><span class="card-arrow">${icon('chevron',22)}</span></div><h3>Движение</h3><div class="metric-value">${numberText(today.movement.steps)} <small>/ ${numberText(today.movement.target)}</small></div><p class="metric-note">${Math.round(today.movement.steps/today.movement.target*100)}% от выбранного ориентира</p>${progress(today.movement.steps/today.movement.target*100,'#6D9A80')}<div class="card-foot">${updatedLabel(today.movement.updated)}</div></button>
        <button class="metric-card food-card" data-detail="nutrition"><div class="card-top"><span class="icon-orb coral">${icon('food',25)}</span><span class="card-arrow">${icon('chevron',22)}</span></div><h3>Питание</h3><div class="metric-value">${numberText(today.nutrition.calories)} <small>ккал</small></div><p class="metric-note">Записано ${today.nutrition.entries} приёма пищи</p><div class="card-status">${badge(isCurrentDay()?'День не завершён':'Дневник неполный','warm')}</div><div class="card-foot">${updatedLabel(today.nutrition.updated)}</div></button>
      </div>
      <button class="wide-card energy-card" data-detail="energy"><div><span class="overline">ОЦЕНКА РАСХОДА ЗА ${formatDate(today.date,{day:'numeric',month:'long'}).toUpperCase()}</span><h3>≈ ${numberText(today.energy.total)} <small>ккал</small></h3><p>По весу, шагам и тренировке. Как рассчитано →</p></div><span class="energy-mark">≈</span></button>
    </div><aside class="side-column"><div class="weight-summary"><span class="icon-orb lavender">${icon('weight',22)}</span><span class="weight-summary-copy"><span class="overline">ПОСЛЕДНИЙ ВЕС</span><strong>${today.weight.kg.toFixed(1).replace('.',',')} кг</strong><span>Измерено ${formatDate(today.weight.measuredAt.slice(0,10),{day:'numeric',month:'long'})}</span></span></div><section class="focus-card"><span class="overline">${isCurrentDay()?'ФОКУС ДНЯ':`ВЫВОД ЗА ${formatDate(today.date,{day:'numeric',month:'long'}).toUpperCase()}`}</span><h2>Дать себе восстановиться</h2><p>Сон короче выбранного ориентира на ${today.sleep.targetMinutes-today.sleep.minutes} мин, при этом была ${today.movement.workout.title.toLowerCase()}. Вечером полезно оставить время для отдыха.</p></section></aside></div>
  </div></main>`;
}

function periodsPage() { return renderPeriods(state, icon); }

function detailContent(name) { const week=periodWindow('week'); const blocks={
  sleep: { title:'Сон', symbol:'moon', tone:'blue', value:minutesText(today.sleep.minutes), description:`На ${today.sleep.targetMinutes-today.sleep.minutes} мин меньше выбранного ориентира.`, rows:[['Ориентир',minutesText(today.sleep.targetMinutes).replace(/ 0 м$/,'')],['Среднее этой недели',minutesText(Math.round(mean(week.current,'sleep')))],['Среднее прошлой недели',minutesText(Math.round(mean(week.previous,'sleep')))]], updated:today.sleep.updated, source:today.sleep.source, sourceNote:'В этой записи нет времени засыпания и пробуждения, поэтому шкала по часам не показана.' },
  movement: { title:'Движение', symbol:'walk', tone:'sage', value:`${numberText(today.movement.steps)} шагов`, description:'Шаги тренировки входят в дневную сумму.', rows:[['Ориентир',`${numberText(today.movement.target)} шагов`],['Тренировка',`${today.movement.workout.title}, ${today.movement.workout.distanceKm.toLocaleString('ru-RU')} км`],['Время тренировки',`${today.movement.workout.durationMinutes} мин`]], updated:today.movement.updated, source:today.movement.source },
  nutrition: { title:'Питание', symbol:'food', tone:'sage', value:`${numberText(today.nutrition.calories)} ккал`, description:`Записано три приёма пищи. ${isCurrentDay()?'День ещё не завершён':'Дневник неполный'}, поэтому цифра не является итогом дня. Цель питания не задана.`, rows:[['Белки','86 г'],['Жиры','52 г'],['Углеводы','174 г']], updated:today.nutrition.updated, source:today.nutrition.source },
  energy: { title:'Оценка расхода', symbol:'info', tone:'sage', value:`≈ ${numberText(today.energy.total)} ккал`, description:`Оценка расхода за ${formatDate(today.date,{day:'numeric',month:'long'})}, а не измеренное значение. Шаги тренировки исключены из отдельной оценки ходьбы.`, rows:[['Основной обмен',`${numberText(today.energy.resting)} ккал`],['Фоновая активность',`${numberText(today.energy.background)} ккал`],['Чистая энергия тренировки',`${numberText(today.energy.workout)} ккал`],['Ходьба вне тренировки',`${numberText(today.energy.walking)} ккал`],['Вес для расчёта',`${today.weight.kg.toFixed(1).replace('.',',')} кг · ${formatDate(today.weight.measuredAt.slice(0,10),{day:'numeric',month:'long'})}`]], updated:today.energy.updated, source:today.energy.source }
}; const d=blocks[name]; return `<div class="modal-backdrop" data-close="true"><section class="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title"><button class="modal-close" data-close="true" aria-label="Закрыть">${icon('close',20)}</button><span class="icon-orb ${d.tone}">${icon(d.symbol,25)}</span><h2 id="detail-title">${d.title}</h2><div class="detail-value">${d.value}</div><p>${d.description}</p><div class="detail-rows">${d.rows.map(([k,v])=>`<div><span>${k}</span><strong>${v}</strong></div>`).join('')}</div><div class="detail-updated">${updatedLabel(d.updated)}</div><details class="detail-source"><summary>Об источнике</summary><p>${d.source===today.energy.source?'Модель расчёта: основной обмен, фоновая активность, тренировка и ходьба вне неё.':`Для живых данных предполагается ${d.source}.`}${d.sourceNote?` ${d.sourceNote}`:''}</p></details></section></div>`; }

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
  const detail=e.target.closest('[data-detail]');
  if(detail){detailReturn=detail.dataset.detail;state.detail=detail.dataset.detail;render();return;}
  if(e.target.matches('.modal-backdrop')||e.target.closest('.modal-close')){closeDetail();return;}
  const mode=e.target.closest('[data-mode]');
  if(mode){state.mode=mode.dataset.mode;render();return;}
});
app.addEventListener('change', e=>{if(e.target.id==='sleep-date') loadLiveWellness(e.target.value);});
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
let wasCurrentDay=isCurrentDay();
setInterval(()=>{const current=isCurrentDay();if(current!==wasCurrentDay){wasCurrentDay=current;render();}},60_000);
render();
