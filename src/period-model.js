import { today, periods, average } from './data.js';

const DAY=86400000;
const iso=date=>date.toISOString().slice(0,10);
const date=key=>new Date(`${key}T12:00:00Z`);
const add=(key,n)=>iso(new Date(date(key).getTime()+n*DAY));
const monthStart=key=>`${key.slice(0,7)}-01`;
const yearStart=key=>`${key.slice(0,4)}-01-01`;
const prevMonth=key=>iso(new Date(Date.UTC(+key.slice(0,4),+key.slice(5,7)-2,1,12)));
const prevYear=key=>`${+key.slice(0,4)-1}-01-01`;
const monday=key=>add(key,-((date(key).getUTCDay()+6)%7));
const span=(start,end)=>{const out=[];for(let d=start;d<=end;d=add(d,1))out.push(d);return out;};
const firstRecord='2025-01-01';
const seed=key=>{const n=+key.replaceAll('-','');const protein=82+n%29,fat=51+(n*7)%24,carbs=193+(n*11)%86;return {calories:protein*4+fat*9+carbs*4,protein,fat,carbs};};
const records=new Map();
for(const key of span(firstRecord,today.date)){
  const n=+key.replaceAll('-','');
  records.set(key,{sleep:423+(n*17)%65,steps:6700+(n*733)%3100,nutrition:n%11===0?null:seed(key),weight:n%4===0?+(66.8-(date(key)-date('2025-01-01'))/DAY*.002).toFixed(1):null});
}
function override(start,source,fields){
  fields.forEach(([field,series])=>series.forEach((value,index)=>{const key=add(start,index);if(records.has(key))records.get(key)[field]=value;}));
}
override('2026-07-01',periods[2],[['sleep',periods[2].previousSleep],['steps',periods[2].previousSteps],['weight',periods[2].previousWeight]]);
override('2026-08-01',periods[2],[['sleep',periods[2].sleep],['steps',periods[2].steps],['weight',periods[2].weight]]);
override('2026-09-01',periods[1],[['sleep',periods[1].sleep],['steps',periods[1].steps],['weight',periods[1].weight]]);
override('2026-10-01',periods[0],[['sleep',periods[0].sleep],['steps',periods[0].steps],['weight',periods[0].weight]]);
for(const [start,flags] of [['2026-07-01',periods[2].previousFoodLogged],['2026-08-01',periods[2].foodLogged],['2026-09-01',periods[1].foodLogged],['2026-10-01',periods[0].foodLogged]])flags.forEach((logged,index)=>{const row=records.get(add(start,index));if(row)row.nutrition=logged?seed(add(start,index)):null;});
records.get(today.date).nutrition=null; // Today's food log is explicitly incomplete.

export function periodWindow(mode){
  const currentStart=mode==='day'?today.date:mode==='week'?monday(today.date):mode==='month'?monthStart(today.date):yearStart(today.date);
  const previousStart=mode==='day'?add(currentStart,-1):mode==='week'?add(currentStart,-7):mode==='month'?prevMonth(currentStart):prevYear(currentStart);
  const previousEnd=add(currentStart,-1);
  return {mode,currentStart,currentObservedEnd:today.date,previousStart,previousEnd,current:span(currentStart,today.date),previous:span(previousStart,previousEnd)};
}
function previousStart(start,mode){return mode==='day'?add(start,-1):mode==='week'?add(start,-7):mode==='month'?prevMonth(start):prevYear(start);}
function periodEnd(start,mode){
  if(mode==='day')return start;
  if(mode==='week')return add(start,6);
  if(mode==='month')return add(iso(new Date(Date.UTC(+start.slice(0,4),+start.slice(5,7),1,12))),-1);
  return `${start.slice(0,4)}-12-31`;
}
export function periodBuckets(mode,count=10){
  const current=periodWindow(mode).currentStart;
  const starts=[current];
  while(starts.length<count)starts.push(previousStart(starts.at(-1),mode));
  return starts.reverse().map(start=>{
    const end=periodEnd(start,mode);
    const observedEnd=end<today.date?end:today.date;
    const observedStart=start<firstRecord?firstRecord:start;
    return {start,end,observedEnd,partial:end>today.date||start===today.date,keys:observedStart<=observedEnd?span(observedStart,observedEnd):[]};
  });
}
export function record(key){return records.get(key)??null;}
export function values(keys,metric){return keys.map(key=>metric==='nutrition'?record(key)?.nutrition?.calories??null:record(key)?.[metric]??null);}
export function mean(keys,metric){return average(values(keys,metric));}
export function macroMean(keys,field){return average(keys.map(key=>record(key)?.nutrition?.[field]??null));}
export function lastWeight(keys){for(let i=keys.length-1;i>=0;i--){const weight=record(keys[i])?.weight;if(weight!==null&&weight!==undefined)return {value:weight,date:keys[i]};}return null;}
