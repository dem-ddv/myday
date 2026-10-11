import { today, numberText } from './data.js?v=c9c1c733f76b';
import { periodBuckets, mean, macroMean, lastWeight, record } from './period-model.js?v=2e467368294c';

const dateText=(key,options={day:'numeric',month:'short'})=>new Intl.DateTimeFormat('ru-RU',{timeZone:'UTC',...options}).format(new Date(`${key}T12:00:00Z`));
const number=value=>value===null?'—':numberText(Math.round(value));
const time=value=>{const total=Math.round(value);return `${Math.floor(total/60)}:${String(total%60).padStart(2,'0')}`;};
const valueText=(metric,value)=>value===null?'—':metric==='sleep'?time(value):metric==='weight'?value.toFixed(1).replace('.',','):number(value);
const metricName={sleep:'Сон',steps:'Шаги',nutrition:'Питание',weight:'Вес'};
const unitName={sleep:'ч:мин за ночь',steps:'шагов/день',nutrition:'ккал/день',weight:'кг'};
const metricKind={sleep:'line',steps:'bars',nutrition:'bars',weight:'dots'};
const stepUnit=value=>{const n=Math.round(value),mod100=n%100,mod10=n%10;return mod100>=11&&mod100<=14?'шагов':mod10===1?'шаг':mod10>=2&&mod10<=4?'шага':'шагов';};
const signed=(value,unit)=>`${value>0?'+':value<0?'−':''}${Math.abs(value).toLocaleString('ru-RU')}${unit}`;

function difference(metric,oldValue,newValue){
  if(oldValue===null||newValue===null)return 'Недостаточно данных';
  if(metric==='sleep'){
    const minutes=Math.round(newValue)-Math.round(oldValue);
    return signed(minutes,' мин');
  }
  if(metric==='steps'){
    if(oldValue===0)return 'Недостаточно данных';
    const percent=(newValue/oldValue-1)*100;
    const rounded=Math.abs(percent)<1&&percent!==0?Math.round(percent*10)/10:Math.round(percent);
    return `${rounded>0?'+':rounded<0?'−':''}${Math.abs(rounded).toLocaleString('ru-RU')}%`;
  }
  if(metric==='nutrition'){
    const calories=Math.round(newValue)-Math.round(oldValue);
    return signed(calories,' ккал/день');
  }
  return signed(Math.round((newValue-oldValue)*10)/10,' кг');
}
function bucketValue(bucket,metric){
  if(!bucket.keys.length)return null;
  return metric==='weight'?lastWeight(bucket.keys)?.value??null:mean(bucket.keys,metric);
}
function bucketLabel(bucket,mode){
  if(mode==='day')return dateText(bucket.start);
  if(mode==='week')return `${dateText(bucket.start)}–${dateText(bucket.end)}`;
  if(mode==='month')return dateText(bucket.start,{month:'long',year:'numeric'});
  return bucket.start.slice(0,4);
}
function axisLabel(bucket,mode){
  if(mode==='day'||mode==='week')return shortDate(bucket.start);
  if(mode==='month')return shortDate(bucket.start,{month:'short'});
  return bucket.start.slice(0,4);
}
const shortDate=(key,options)=>dateText(key,options).replace(/\./g,'');
function tipDate(bucket,mode){
  const end=bucket.partial?bucket.observedEnd:bucket.end;
  if(mode==='day')return shortDate(bucket.start);
  if(mode==='week')return bucket.start.slice(0,7)===end.slice(0,7)?`${+bucket.start.slice(8)}–${shortDate(end)}`:`${shortDate(bucket.start)}–${shortDate(end)}`;
  if(mode==='month')return bucket.partial?`${+bucket.start.slice(8)}–${shortDate(end)} ${bucket.start.slice(0,4)}`:dateText(bucket.start,{month:'long',year:'numeric'}).replace(/\sг\.$/,'');
  return bucket.partial?`1 янв–${shortDate(end)} ${bucket.start.slice(0,4)}`:bucket.start.slice(0,4);
}
function tooltip(bucket,mode,metric,value){
  const measured=metric==='weight'?lastWeight(bucket.keys):null;
  const date=tipDate(bucket,mode);
  const valueLabel=value===null?'Нет записи':metric==='sleep'?`${Math.floor(Math.round(value)/60)} ч ${Math.round(value)%60} мин`:metric==='steps'?`${valueText(metric,value)} ${stepUnit(value)}/день`:`${valueText(metric,value)}${metric==='weight'?' кг':' ккал/день'}`;
  const detail=measured?`Замер ${shortDate(measured.date)}`:'';
  return {label:`${metricName[metric]}: ${date}, ${valueLabel}${detail?`, ${detail}`:''}`,html:`<span class="history-tip" aria-hidden="true"><span class="history-tip-date">${date}</span><strong class="history-tip-value">${valueLabel}</strong>${detail?`<span class="history-tip-meta">${detail}</span>`:''}</span>`};
}
function chartScale(metric,values){
  const valid=values.filter(value=>value!==null);
  if(!valid.length)return {min:0,max:1,ticks:[1,.5,0]};
  if(metric==='steps'||metric==='nutrition'){
    const step=metric==='steps'?1000:250;
    const max=Math.max(step,Math.ceil(Math.max(...valid)/step)*step);
    return {min:0,max,ticks:[max,max/2,0]};
  }
  if(metric==='sleep'){
    const min=Math.floor((Math.min(...valid)-15)/30)*30;
    const max=Math.ceil((Math.max(...valid)+15)/30)*30;
    return {min,max,ticks:[max,(max+min)/2,min]};
  }
  const min=Math.floor((Math.min(...valid)-.2)*2)/2;
  const max=Math.ceil((Math.max(...valid)+.2)*2)/2;
  return {min,max,ticks:[max,(max+min)/2,min]};
}
function chart(bucketList,mode,metric){
  const values=bucketList.map(bucket=>bucketValue(bucket,metric));
  const firstDataIndex=values.findIndex(value=>value!==null);
  const scale=chartScale(metric,values);
  const kind=metricKind[metric];
  const tick=value=>metric==='sleep'?time(value):metric==='weight'?value.toFixed(1).replace('.',','):numberText(Math.round(value));
  const yAxis=`<div class="history-y" aria-hidden="true">${scale.ticks.map(value=>`<span>${tick(value)}</span>`).join('')}</div>`;
  const guides='<div class="history-guides" aria-hidden="true"><i></i><i></i><i></i></div>';
  let marks;
  if(kind==='bars'){
    marks=`<div class="history-bars">${bucketList.map((bucket,index)=>{
      const value=values[index];
      const role=index===bucketList.length-1?'current':'past';
      const side=index<=2?'tip-left':index>=7?'tip-right':'';
      if(value===null&&mode==='year')return '<span class="history-bar-slot no-history" aria-hidden="true"></span>';
      const tip=tooltip(bucket,mode,metric,value);
      if(value===null)return `<span class="history-bar-slot missing"><button type="button" class="history-missing ${side}" aria-label="${tip.label}">—${tip.html}</button></span>`;
      return `<span class="history-bar-slot"><button type="button" class="history-bar ${role}${bucket.partial?' partial':''} ${side}${value/scale.max>.7?' tip-below':''}" style="--height:${Math.max(2,value/scale.max*100)}%" aria-label="${tip.label}">${tip.html}</button></span>`;
    }).join('')}</div>`;
  }else{
    const points=values.map((value,index)=>value===null?null:{x:(index+.5)/values.length*100,y:(scale.max-value)/(scale.max-scale.min)*100});
    let line='';
    if(kind==='line'){
      const segments=[];let current=[];
      for(const point of points){if(point)current.push(`${point.x},${point.y}`);else if(current.length){segments.push(current);current=[];}}
      if(current.length)segments.push(current);
      line=`<svg class="history-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${segments.filter(segment=>segment.length>1).map(segment=>`<polyline points="${segment.join(' ')}"/>`).join('')}</svg>`;
    }
    marks=`${line}${bucketList.map((bucket,index)=>{
      const point=points[index];if(!point)return '';
      const role=index===bucketList.length-1?'current':'past';
      const side=index<=2?'tip-left':index>=7?'tip-right':'';
      const tip=tooltip(bucket,mode,metric,values[index]);
      return `<button type="button" class="history-point ${role}${bucket.partial?' partial':''} ${side}${point.y<30?' tip-below':''}" style="--x:${point.x}%;--y:${point.y}%" aria-label="${tip.label}">${tip.html}</button>`;
    }).join('')}`;
  }
  const indices=mode==='year'?[0,Math.max(firstDataIndex,0),bucketList.length-1]:[0,Math.floor((bucketList.length-1)/2),bucketList.length-1];
  const labels=`<div class="history-x ${mode==='year'?'year':''}" aria-hidden="true">${[...new Set(indices)].map(index=>`<span style="--x:${(index+.5)/bucketList.length*100}%">${axisLabel(bucketList[index],mode)}</span>`).join('')}</div>`;
  const periodCount=mode==='year'?`${bucketList.length} лет, ${firstDataIndex<0?'записей нет':`первые ${firstDataIndex} без записей`}`:mode==='month'?`${bucketList.length} месяцев`:mode==='week'?`${bucketList.length} недель`:`${bucketList.length} дней`;
  const gap=mode==='year'&&firstDataIndex>0?`<span class="history-gap-note" style="--gap-width:${firstDataIndex/bucketList.length*100}%" aria-hidden="true">${bucketList[0].start.slice(0,4)}–${bucketList[firstDataIndex-1].start.slice(0,4)} нет записей</span>`:'';
  return `<div class="history-chart ${kind}" role="group" aria-label="${metricName[metric]}: история за ${periodCount}"><div class="history-visual">${yAxis}<div class="history-track">${guides}${gap}${marks}</div></div>${labels}</div>`;
}
function macroDetails(first,last){
  const rows=[first,last].map((bucket,index)=>{
    const values=['protein','fat','carbs'].map(field=>number(macroMean(bucket.keys,field)));
    return `<div><span>${index?'Конец':'Начало'}</span><strong>${values.join(' · ')} г</strong></div>`;
  });
  return `<details class="period-macros"><summary>Белки · жиры · углеводы</summary><div class="period-macro-head">Среднее по дням с записями</div>${rows.join('')}</details>`;
}
function card(buckets,mode,metric,symbol,tone,icon){
  const firstDataIndex=mode==='year'?buckets.findIndex(bucket=>bucketValue(bucket,metric)!==null):0;
  const first=mode==='year'?buckets[Math.min(firstDataIndex<0?0:firstDataIndex,buckets.length-2)]:buckets[0],last=buckets.at(-1);
  const oldValue=bucketValue(first,metric),newValue=bucketValue(last,metric);
  const firstCount=first.keys.filter(key=>metric==='weight'?Number.isFinite(record(key)?.weight?.kg):metric==='nutrition'?Number.isFinite(record(key)?.nutrition?.calories):Number.isFinite(record(key)?.[metric])).length;
  const oldMeasure=metric==='weight'?lastWeight(first.keys):null;
  const newMeasure=metric==='weight'?lastWeight(last.keys):null;
  const note=metric==='nutrition'?' · по внесённым записям':'';
  const change=mode==='year'&&metric!=='weight'&&firstCount<7?'Недостаточно данных':newValue===null&&mode==='day'&&metric==='nutrition'?'Нет записи':newValue===null&&mode==='day'&&metric==='weight'?'Нет замера':difference(metric,oldValue,newValue);
  const pair=`<div class="history-comparison" role="group" aria-label="${bucketLabel(first,mode)} — ${bucketLabel(last,mode)}"><div class="history-pair"><span class="history-old">${valueText(metric,oldValue)}${oldMeasure?`<small>${shortDate(oldMeasure.date)}${mode==='year'?` ${oldMeasure.date.slice(0,4)}`:''}</small>`:''}</span><span class="history-arrow" aria-hidden="true">→</span><span class="history-new">${valueText(metric,newValue)}${newMeasure?`<small>${shortDate(newMeasure.date)}${mode==='year'?` ${newMeasure.date.slice(0,4)}`:''}</small>`:''}</span></div><strong class="history-delta">${change}</strong></div>`;
  const completed=metric==='nutrition'?last.keys.filter(key=>record(key)?.nutrition).length:0;
  const caveat=mode==='year'&&metric!=='weight'&&firstCount>0&&firstCount<7?`<p class="trend-caveat">${first.start.slice(0,4)}: только ${firstCount} ${firstCount===1?'день':firstCount<5?'дня':'дней'} с записями.</p>`:metric==='nutrition'&&mode!=='day'&&completed>0&&completed<3?`<p class="trend-caveat">Среднее пока по ${completed===1?'одному дню':'двум дням'} с записями.</p>`:'';
  return `<article class="period-card trend-card ${metric}"><div class="period-card-head"><span class="icon-orb ${tone}">${icon(symbol,22)}</span><div><h2>${metricName[metric]}</h2><span class="trend-unit">${unitName[metric]}${note}</span></div></div>${chart(buckets,mode,metric)}${pair}${caveat}${metric==='nutrition'?macroDetails(first,last):''}</article>`;
}
export function renderPeriods(state,icon){
  const buckets=periodBuckets(state.mode,10);
  const modes={day:'День',week:'Неделя',month:'Месяц',year:'Год'};
  return `<main class="page periods-page"><div class="content-shell"><section class="period-hero"><div><div class="eyebrow">ЛИЧНЫЕ ДАННЫЕ · ДИНАМИКА И НАБЛЮДЕНИЯ</div><h1>Периоды</h1></div></section><div class="period-controls"><div class="period-mode" role="group" aria-label="Масштаб сравнения">${Object.entries(modes).map(([key,name])=>`<button data-mode="${key}" class="${state.mode===key?'selected':''}" aria-pressed="${state.mode===key}">${name}</button>`).join('')}</div><span class="period-asof">Данные по ${dateText(today.date,{day:'numeric',month:'long',year:'numeric'})}</span></div><div class="period-card-grid">${card(buckets,state.mode,'sleep','moon','blue',icon)}${card(buckets,state.mode,'steps','walk','sage',icon)}${card(buckets,state.mode,'nutrition','food','coral',icon)}${card(buckets,state.mode,'weight','weight','lavender',icon)}</div><details class="period-method compact-method"><summary>Как считаются значения</summary><p>Числа под графиком сравнивают начало ряда с последним интервалом; пустые годы слева в расчёт не входят. Сон и шаги — среднее по дням с данными, питание — среднее по дням с записями. Вес — последний замер в периоде. Полосатый столбец или пунктирная точка показывают неполный последний интервал; пропуски не считаются нулём. Нажми, коснись или перейди клавишей на точку графика, чтобы увидеть точное значение.</p></details></div></main>`;
}
