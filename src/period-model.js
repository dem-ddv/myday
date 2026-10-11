import { today, days, average } from './data.js?v=1b85eb6ad1fa';

const DAY = 86400000;
const iso = date => date.toISOString().slice(0,10);
const date = key => new Date(`${key}T12:00:00Z`);
const add = (key,n) => iso(new Date(date(key).getTime()+n*DAY));
const monday = key => add(key,-((date(key).getUTCDay()+6)%7));
const span = (start,end) => { const out=[]; for(let d=start;d<=end;d=add(d,1)) out.push(d); return out; };
const records = () => new Map(days.map(row => [row.date,row]));
const currentStart = mode => mode==='day'?today.calendarToday:mode==='week'?monday(today.calendarToday):mode==='month'?`${today.calendarToday.slice(0,7)}-01`:`${today.calendarToday.slice(0,4)}-01-01`;
const previousStart = (start,mode) => mode==='day'?add(start,-1):mode==='week'?add(start,-7):mode==='month'?iso(new Date(Date.UTC(+start.slice(0,4),+start.slice(5,7)-2,1,12))):`${+start.slice(0,4)-1}-01-01`;
const periodEnd = (start,mode) => mode==='day'?start:mode==='week'?add(start,6):mode==='month'?add(iso(new Date(Date.UTC(+start.slice(0,4),+start.slice(5,7),1,12))),-1):`${start.slice(0,4)}-12-31`;

export function periodWindow(mode) {
  const start=currentStart(mode),prev=previousStart(start,mode),end=add(start,-1);
  return { mode,currentStart:start,currentObservedEnd:today.calendarToday,previousStart:prev,previousEnd:end,current:span(start,today.calendarToday),previous:span(prev,end) };
}
export function periodBuckets(mode,count=10) {
  const starts=[currentStart(mode)];
  while(starts.length<count) starts.push(previousStart(starts.at(-1),mode));
  return starts.reverse().map(start => { const end=periodEnd(start,mode),observedEnd=end<today.calendarToday?end:today.calendarToday; return { start,end,observedEnd,partial:end>=today.calendarToday,keys:start<=observedEnd?span(start,observedEnd):[] }; });
}
export function record(key) { return records().get(key) ?? null; }
export function values(keys,metric) { const data=records(); return keys.map(key => metric==='nutrition'?data.get(key)?.nutrition?.calories??null:data.get(key)?.[metric]??null); }
export function mean(keys,metric) { return average(values(keys,metric)); }
export function macroMean(keys,field) { const data=records(); return average(keys.map(key => data.get(key)?.nutrition?.[field]??null)); }
export function lastWeight(keys) { const data=records(); for(let i=keys.length-1;i>=0;i--){ const weight=data.get(keys[i])?.weight?.kg; if(Number.isFinite(weight)) return {value:weight,date:keys[i]}; } return null; }
