var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// dashboard/dist/src/api-config.js?v=d34637085ebe
function setAuthenticated(value) {
  authenticated = Boolean(value);
}
var onMyDay, apiBase, authenticated;
var init_api_config = __esm({
  "dashboard/dist/src/api-config.js?v=d34637085ebe"() {
    "use strict";
    onMyDay = ["ddvpage.ru", "www.ddvpage.ru"].includes(location.hostname);
    apiBase = onMyDay ? "https://api.ddvpage.ru" : location.origin;
    authenticated = !onMyDay;
  }
});

// dashboard/dist/src/data.js?v=931cb9d2d2d3
var data_exports = {};
__export(data_exports, {
  average: () => average,
  days: () => days,
  minutesText: () => minutesText,
  moscowDate: () => moscowDate,
  numberText: () => numberText,
  selectDay: () => selectDay,
  setDashboard: () => setDashboard,
  today: () => today
});
function moscowDate(now = /* @__PURE__ */ new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Moscow", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function setDashboard(payload, now = /* @__PURE__ */ new Date()) {
  days = Array.isArray(payload.days) ? payload.days : [];
  const previousCalendarToday = today.calendarToday;
  today.calendarToday = moscowDate(now);
  selectDay(previousCalendarToday === today.calendarToday && today.date <= today.calendarToday ? today.date : today.calendarToday);
  today.updatedAt = payload.updatedAt ?? "";
}
function selectDay(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || key > today.calendarToday || Number.isNaN(Date.parse(`${key}T12:00:00Z`))) return false;
  today.date = key;
  const row = days.find((day) => day.date === key) ?? {};
  for (const field of ["sleep", "steps", "stepsTotal", "hrv", "restingPulse", "nutrition", "energy", "insight"]) today[field] = row[field] ?? null;
  today.weight = days.filter((day) => day.date <= key && day.weight).sort((a, b) => b.date.localeCompare(a.date))[0]?.weight ?? null;
  return true;
}
function average(values2) {
  const valid = values2.filter(Number.isFinite);
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
}
function minutesText(n) {
  return Number.isFinite(n) ? `${Math.floor(n / 60)} \u0447 ${Math.round(n % 60)} \u043C` : "\u041D\u0435\u0442 \u0437\u0430\u043F\u0438\u0441\u0438";
}
function numberText(n) {
  return Number.isFinite(n) ? Math.round(n).toLocaleString("ru-RU") : "\u041D\u0435\u0442 \u0437\u0430\u043F\u0438\u0441\u0438";
}
var today, days;
var init_data = __esm({
  "dashboard/dist/src/data.js?v=931cb9d2d2d3"() {
    "use strict";
    today = { date: "", calendarToday: "", sleep: null, steps: null, stepsTotal: null, hrv: null, restingPulse: null, nutrition: null, energy: null, weight: null, insight: null, updatedAt: "" };
    days = [];
  }
});

// dashboard/dist/src/period-model.js?v=88b7a5a9d64a
function periodBuckets(mode, count = 10) {
  const starts = [currentStart(mode)];
  while (starts.length < count) starts.push(previousStart(starts.at(-1), mode));
  return starts.reverse().map((start) => {
    const end = periodEnd(start, mode), observedEnd = end < today.calendarToday ? end : today.calendarToday;
    return { start, end, observedEnd, partial: end >= today.calendarToday, keys: start <= observedEnd ? span(start, observedEnd) : [] };
  });
}
function record(key) {
  return records().get(key) ?? null;
}
function values(keys, metric) {
  const data = records();
  return keys.map((key) => metric === "nutrition" ? data.get(key)?.nutrition?.calories ?? null : data.get(key)?.[metric] ?? null);
}
function mean(keys, metric) {
  return average(values(keys, metric));
}
function macroMean(keys, field) {
  const data = records();
  return average(keys.map((key) => data.get(key)?.nutrition?.[field] ?? null));
}
function lastWeight(keys) {
  const data = records();
  for (let i = keys.length - 1; i >= 0; i--) {
    const weight = data.get(keys[i])?.weight?.kg;
    if (Number.isFinite(weight)) return { value: weight, date: keys[i] };
  }
  return null;
}
var DAY, iso, date, add, monday, span, records, currentStart, previousStart, periodEnd;
var init_period_model = __esm({
  "dashboard/dist/src/period-model.js?v=88b7a5a9d64a"() {
    "use strict";
    init_data();
    DAY = 864e5;
    iso = (date2) => date2.toISOString().slice(0, 10);
    date = (key) => /* @__PURE__ */ new Date(`${key}T12:00:00Z`);
    add = (key, n) => iso(new Date(date(key).getTime() + n * DAY));
    monday = (key) => add(key, -((date(key).getUTCDay() + 6) % 7));
    span = (start, end) => {
      const out = [];
      for (let d = start; d <= end; d = add(d, 1)) out.push(d);
      return out;
    };
    records = () => new Map(days.map((row) => [row.date, row]));
    currentStart = (mode) => mode === "day" ? today.calendarToday : mode === "week" ? monday(today.calendarToday) : mode === "month" ? `${today.calendarToday.slice(0, 7)}-01` : `${today.calendarToday.slice(0, 4)}-01-01`;
    previousStart = (start, mode) => mode === "day" ? add(start, -1) : mode === "week" ? add(start, -7) : mode === "month" ? iso(new Date(Date.UTC(+start.slice(0, 4), +start.slice(5, 7) - 2, 1, 12))) : `${+start.slice(0, 4) - 1}-01-01`;
    periodEnd = (start, mode) => mode === "day" ? start : mode === "week" ? add(start, 6) : mode === "month" ? add(iso(new Date(Date.UTC(+start.slice(0, 4), +start.slice(5, 7), 1, 12))), -1) : `${start.slice(0, 4)}-12-31`;
  }
});

// dashboard/dist/src/period-view.js?v=bdc75e187339
function difference(metric, oldValue, newValue) {
  if (oldValue === null || newValue === null) return "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u0434\u0430\u043D\u043D\u044B\u0445";
  if (metric === "sleep") {
    const minutes = Math.round(newValue) - Math.round(oldValue);
    if (Math.abs(minutes) < 60) return signed(minutes, " \u043C\u0438\u043D");
    const magnitude = Math.abs(minutes);
    return `${minutes < 0 ? "\u2212" : "+"}${Math.floor(magnitude / 60)} \u0447${magnitude % 60 ? ` ${magnitude % 60} \u043C\u0438\u043D` : ""}`;
  }
  if (metric === "steps") {
    if (oldValue === 0) return "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u0434\u0430\u043D\u043D\u044B\u0445";
    const percent = (newValue / oldValue - 1) * 100;
    const rounded = Math.abs(percent) < 1 && percent !== 0 ? Math.round(percent * 10) / 10 : Math.round(percent);
    return `${rounded > 0 ? "+" : rounded < 0 ? "\u2212" : ""}${Math.abs(rounded).toLocaleString("ru-RU")}%`;
  }
  if (metric === "nutrition") {
    const calories = Math.round(newValue) - Math.round(oldValue);
    return signed(calories, " \u043A\u043A\u0430\u043B/\u0434\u0435\u043D\u044C");
  }
  return signed(Math.round((newValue - oldValue) * 10) / 10, " \u043A\u0433");
}
function bucketValue(bucket, metric) {
  if (!bucket.keys.length) return null;
  return metric === "weight" ? lastWeight(bucket.keys)?.value ?? null : mean(bucket.keys, metric);
}
function bucketLabel(bucket, mode) {
  if (mode === "day") return dateText(bucket.start);
  if (mode === "week") return `${dateText(bucket.start)}\u2013${dateText(bucket.end)}`;
  if (mode === "month") return dateText(bucket.start, { month: "long", year: "numeric" });
  return bucket.start.slice(0, 4);
}
function axisLabel(bucket, mode) {
  if (mode === "day") return shortDate(bucket.start);
  if (mode === "week") return bucket.start.slice(0, 7) === bucket.end.slice(0, 7) ? `${+bucket.start.slice(8)}\u2013${shortDate(bucket.end)}` : `${shortDate(bucket.start)}\u2013${shortDate(bucket.end)}`;
  if (mode === "month") return `${shortDate(bucket.start, { month: "short" })} ${bucket.start.slice(2, 4)}`;
  return bucket.start.slice(0, 4);
}
function tipDate(bucket, mode) {
  const end = bucket.partial ? bucket.observedEnd : bucket.end;
  if (mode === "day") return shortDate(bucket.start);
  if (mode === "week") return bucket.start.slice(0, 7) === end.slice(0, 7) ? `${+bucket.start.slice(8)}\u2013${shortDate(end)}` : `${shortDate(bucket.start)}\u2013${shortDate(end)}`;
  if (mode === "month") return bucket.partial ? `${+bucket.start.slice(8)}\u2013${shortDate(end)} ${bucket.start.slice(0, 4)}` : dateText(bucket.start, { month: "long", year: "numeric" }).replace(/\sг\.$/, "");
  return bucket.partial ? `1 \u044F\u043D\u0432\u2013${shortDate(end)} ${bucket.start.slice(0, 4)}` : bucket.start.slice(0, 4);
}
function tooltip(bucket, mode, metric, value) {
  const measured = metric === "weight" ? lastWeight(bucket.keys) : null;
  const date2 = tipDate(bucket, mode);
  const valueLabel = value === null ? "\u041D\u0435\u0442 \u0437\u0430\u043F\u0438\u0441\u0438" : metric === "sleep" ? `${Math.floor(Math.round(value) / 60)} \u0447 ${Math.round(value) % 60} \u043C\u0438\u043D` : metric === "steps" ? `${valueText(metric, value)} ${stepUnit(value)}/\u0434\u0435\u043D\u044C` : `${valueText(metric, value)}${metric === "weight" ? " \u043A\u0433" : " \u043A\u043A\u0430\u043B/\u0434\u0435\u043D\u044C"}`;
  const detail = measured ? `\u0417\u0430\u043C\u0435\u0440 ${shortDate(measured.date)}` : "";
  return { label: `${metricName[metric]}: ${date2}, ${valueLabel}${detail ? `, ${detail}` : ""}`, html: `<span class="history-tip" aria-hidden="true"><span class="history-tip-date">${date2}</span><strong class="history-tip-value">${valueLabel}</strong>${detail ? `<span class="history-tip-meta">${detail}</span>` : ""}</span>` };
}
function chartScale(metric, values2) {
  const valid = values2.filter((value) => value !== null);
  if (!valid.length) return { min: 0, max: 1, ticks: [1, 0.5, 0] };
  if (metric === "steps" || metric === "nutrition") {
    const step = metric === "steps" ? 1e3 : 250;
    const max2 = Math.max(step, Math.ceil(Math.max(...valid) / step) * step);
    return { min: 0, max: max2, ticks: [max2, max2 / 2, 0] };
  }
  if (metric === "sleep") {
    const min2 = Math.floor((Math.min(...valid) - 15) / 30) * 30;
    const max2 = Math.ceil((Math.max(...valid) + 15) / 30) * 30;
    return { min: min2, max: max2, ticks: [max2, (max2 + min2) / 2, min2] };
  }
  const center = (Math.min(...valid) + Math.max(...valid)) / 2;
  const span2 = Math.max(4, Math.max(...valid) - Math.min(...valid) + 1);
  const min = Math.floor((center - span2 / 2) * 2) / 2;
  const max = Math.ceil((center + span2 / 2) * 2) / 2;
  return { min, max, ticks: [max, (max + min) / 2, min] };
}
function chart(bucketList, mode, metric) {
  const values2 = bucketList.map((bucket) => bucketValue(bucket, metric));
  const firstDataIndex = values2.findIndex((value) => value !== null);
  const scale = chartScale(metric, values2);
  const kind = metricKind[metric];
  const tick = (value) => metric === "sleep" ? time(value) : metric === "weight" ? value.toFixed(1).replace(".", ",") : numberText(Math.round(value));
  const yAxis = `<div class="history-y" aria-hidden="true">${scale.ticks.map((value) => `<span>${tick(value)}</span>`).join("")}</div>`;
  const guides = '<div class="history-guides" aria-hidden="true"><i></i><i></i><i></i></div>';
  let marks;
  if (kind === "bars") {
    marks = `<div class="history-bars">${bucketList.map((bucket, index) => {
      const value = values2[index];
      const role = index === bucketList.length - 1 ? "current" : "past";
      const side = index <= 2 ? "tip-left" : index >= 7 ? "tip-right" : "";
      if (value === null && mode === "year") return '<span class="history-bar-slot no-history" aria-hidden="true"></span>';
      const tip = tooltip(bucket, mode, metric, value);
      if (value === null) return `<span class="history-bar-slot missing"><button type="button" class="history-missing ${side}" ${mode === "day" ? `data-day="${bucket.start}"` : ""} aria-label="${tip.label}${mode === "day" ? ", \u043E\u0442\u043A\u0440\u044B\u0442\u044C \u0434\u0435\u043D\u044C" : ""}">\u2014${tip.html}</button></span>`;
      return `<span class="history-bar-slot"><button type="button" class="history-bar ${role}${bucket.partial ? " partial" : ""} ${side}${value / scale.max > 0.7 ? " tip-below" : ""}" ${mode === "day" ? `data-day="${bucket.start}"` : ""} style="--height:${Math.max(2, value / scale.max * 100)}%" aria-label="${tip.label}${mode === "day" ? ", \u043E\u0442\u043A\u0440\u044B\u0442\u044C \u0434\u0435\u043D\u044C" : ""}">${tip.html}</button></span>`;
    }).join("")}</div>`;
  } else {
    const points = values2.map((value, index) => value === null ? null : { x: (index + 0.5) / values2.length * 100, y: (scale.max - value) / (scale.max - scale.min) * 100 });
    let line = "";
    if (kind === "line" || kind === "dots") {
      const segments = [];
      let current = [];
      for (const point of points) {
        if (point) current.push(`${point.x},${point.y}`);
        else if (current.length) {
          segments.push(current);
          current = [];
        }
      }
      if (current.length) segments.push(current);
      const drawn = kind === "dots" ? points.filter(Boolean).map((point) => `${point.x},${point.y}`) : segments.filter((segment) => segment.length > 1).map((segment) => segment.join(" "));
      line = `<svg class="history-line ${kind === "dots" ? "weight-line" : ""}" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${kind === "dots" && drawn.length > 1 ? `<polyline points="${drawn.join(" ")}"/>` : kind === "line" ? drawn.map((segment) => `<polyline points="${segment}"/>`).join("") : ""}</svg>`;
    }
    marks = `${line}${bucketList.map((bucket, index) => {
      const point = points[index];
      if (!point) return "";
      const role = index === bucketList.length - 1 ? "current" : "past";
      const side = index <= 2 ? "tip-left" : index >= 7 ? "tip-right" : "";
      const tip = tooltip(bucket, mode, metric, values2[index]);
      return `<button type="button" class="history-point ${role}${bucket.partial ? " partial" : ""} ${side}${point.y < 30 ? " tip-below" : ""}" ${mode === "day" ? `data-day="${bucket.start}"` : ""} style="--x:${point.x}%;--y:${point.y}%" aria-label="${tip.label}${mode === "day" ? ", \u043E\u0442\u043A\u0440\u044B\u0442\u044C \u0434\u0435\u043D\u044C" : ""}">${tip.html}</button>`;
    }).join("")}`;
  }
  const indices = mode === "year" ? [0, Math.max(firstDataIndex, 0), bucketList.length - 1] : [0, Math.floor((bucketList.length - 1) / 2), bucketList.length - 1];
  const labels = `<div class="history-x ${mode === "year" ? "year" : ""}" aria-hidden="true">${[...new Set(indices)].map((index) => `<span style="--x:${(index + 0.5) / bucketList.length * 100}%">${axisLabel(bucketList[index], mode)}</span>`).join("")}</div>`;
  const periodCount = mode === "year" ? `${bucketList.length} \u043B\u0435\u0442, ${firstDataIndex < 0 ? "\u0437\u0430\u043F\u0438\u0441\u0435\u0439 \u043D\u0435\u0442" : `\u043F\u0435\u0440\u0432\u044B\u0435 ${firstDataIndex} \u0431\u0435\u0437 \u0437\u0430\u043F\u0438\u0441\u0435\u0439`}` : mode === "month" ? `${bucketList.length} \u043C\u0435\u0441\u044F\u0446\u0435\u0432` : mode === "week" ? `${bucketList.length} \u043D\u0435\u0434\u0435\u043B\u044C` : `${bucketList.length} \u0434\u043D\u0435\u0439`;
  const gap = mode === "year" && firstDataIndex > 1 ? `<span class="history-gap-note" style="--gap-width:${firstDataIndex / bucketList.length * 100}%" aria-hidden="true">${bucketList[0].start.slice(0, 4)}\u2013${bucketList[firstDataIndex - 1].start.slice(0, 4)} \u043D\u0435\u0442 \u0437\u0430\u043F\u0438\u0441\u0435\u0439</span>` : "";
  return `<div class="history-chart ${kind}" role="group" aria-label="${metricName[metric]}: \u0438\u0441\u0442\u043E\u0440\u0438\u044F \u0437\u0430 ${periodCount}"><div class="history-visual">${yAxis}<div class="history-track">${guides}${gap}${marks}</div></div>${labels}</div>`;
}
function macroDetails(first, last) {
  const rows = [first, last].map((bucket, index) => {
    const values2 = ["protein", "fat", "carbs"].map((field) => number(macroMean(bucket.keys, field)));
    return `<div><span>${index ? "\u041A\u043E\u043D\u0435\u0446" : "\u041D\u0430\u0447\u0430\u043B\u043E"}</span><strong>${values2.join(" \xB7 ")} \u0433</strong></div>`;
  });
  return `<details class="period-macros"><summary>\u0411\u0435\u043B\u043A\u0438 \xB7 \u0436\u0438\u0440\u044B \xB7 \u0443\u0433\u043B\u0435\u0432\u043E\u0434\u044B</summary><div class="period-macro-head">\u0421\u0440\u0435\u0434\u043D\u0435\u0435 \u043F\u043E \u0434\u043D\u044F\u043C \u0441 \u0437\u0430\u043F\u0438\u0441\u044F\u043C\u0438</div>${rows.join("")}</details>`;
}
function card(buckets, mode, metric, symbol, tone, icon2) {
  const observed = buckets.filter((bucket) => bucketValue(bucket, metric) !== null);
  const first = observed[0] ?? buckets[0], last = observed.at(-1) ?? buckets.at(-1);
  const oldValue = bucketValue(first, metric), newValue = bucketValue(last, metric);
  const firstCount = first.keys.filter((key) => metric === "weight" ? Number.isFinite(record(key)?.weight?.kg) : metric === "nutrition" ? Number.isFinite(record(key)?.nutrition?.calories) : Number.isFinite(record(key)?.[metric])).length;
  const change = observed.length < 2 || mode === "year" && metric !== "weight" && firstCount < 7 ? "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u0434\u0430\u043D\u043D\u044B\u0445" : difference(metric, oldValue, newValue);
  const pair = observed.length < 2 ? `<div class="history-comparison"><span class="history-change-label">\u0414\u043B\u044F \u0441\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u044F \u043D\u0443\u0436\u043D\u043E \u0434\u0432\u0430 \u043F\u0435\u0440\u0438\u043E\u0434\u0430 \u0441 \u0434\u0430\u043D\u043D\u044B\u043C\u0438</span></div>` : `<div class="history-comparison" role="group" aria-label="\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u043C\u0435\u0436\u0434\u0443 ${bucketLabel(first, mode)} \u0438 ${bucketLabel(last, mode)}"><span class="history-change-label">\u041F\u043E \u043F\u0435\u0440\u0432\u044B\u043C \u0438 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u043C \u0434\u0430\u043D\u043D\u044B\u043C</span><strong class="history-delta">${change}</strong></div>`;
  const completed = metric === "nutrition" ? last.keys.filter((key) => record(key)?.nutrition).length : 0;
  const caveat = mode === "year" && metric !== "weight" && firstCount > 0 && firstCount < 7 ? `<p class="trend-caveat">${first.start.slice(0, 4)}: \u0442\u043E\u043B\u044C\u043A\u043E ${firstCount} ${firstCount === 1 ? "\u0434\u0435\u043D\u044C" : firstCount < 5 ? "\u0434\u043D\u044F" : "\u0434\u043D\u0435\u0439"} \u0441 \u0437\u0430\u043F\u0438\u0441\u044F\u043C\u0438.</p>` : metric === "nutrition" && mode !== "day" && completed > 0 && completed < 3 ? `<p class="trend-caveat">\u0421\u0440\u0435\u0434\u043D\u0435\u0435 \u043F\u043E\u043A\u0430 \u043F\u043E ${completed === 1 ? "\u043E\u0434\u043D\u043E\u043C\u0443 \u0434\u043D\u044E" : "\u0434\u0432\u0443\u043C \u0434\u043D\u044F\u043C"} \u0441 \u0437\u0430\u043F\u0438\u0441\u044F\u043C\u0438.</p>` : "";
  return `<article class="period-card trend-card ${metric}"><div class="period-card-head"><span class="icon-orb ${tone}">${icon2(symbol, 22)}</span><div><h2>${metricName[metric]}</h2><span class="trend-unit">${unitName[metric]}</span></div></div>${chart(buckets, mode, metric)}${pair}${caveat}${metric === "nutrition" ? macroDetails(first, last) : ""}</article>`;
}
function renderPeriods(state2, icon2) {
  const buckets = periodBuckets(state2.mode, 10);
  const modes = { day: "\u041F\u043E \u0434\u043D\u044F\u043C", week: "\u041F\u043E \u043D\u0435\u0434\u0435\u043B\u044F\u043C", month: "\u041F\u043E \u043C\u0435\u0441\u044F\u0446\u0430\u043C", year: "\u041F\u043E \u0433\u043E\u0434\u0430\u043C" };
  return `<main class="page periods-page"><div class="content-shell"><section class="period-hero"><div><h1>\u041F\u0435\u0440\u0438\u043E\u0434\u044B</h1></div></section><div class="period-controls"><div class="period-mode" role="group" aria-label="\u041C\u0430\u0441\u0448\u0442\u0430\u0431 \u0441\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u044F">${Object.entries(modes).map(([key, name]) => `<button data-mode="${key}" class="${state2.mode === key ? "selected" : ""}" aria-pressed="${state2.mode === key}">${name}</button>`).join("")}</div><span class="period-asof">\u041D\u0430 ${dateText(today.calendarToday, { day: "numeric", month: "long", year: "numeric" })}</span></div><div class="period-card-grid">${card(buckets, state2.mode, "sleep", "moon", "blue", icon2)}${card(buckets, state2.mode, "steps", "walk", "sage", icon2)}${card(buckets, state2.mode, "nutrition", "food", "coral", icon2)}${card(buckets, state2.mode, "weight", "weight", "lavender", icon2)}</div><details class="period-method compact-method"><summary>\u041A\u0430\u043A \u0441\u0447\u0438\u0442\u0430\u044E\u0442\u0441\u044F \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F</summary><p>\u0421\u043E\u043D \u0438 \u0448\u0430\u0433\u0438 \u2014 \u0441\u0440\u0435\u0434\u043D\u0435\u0435 \u043F\u043E \u0434\u043D\u044F\u043C \u0441 \u0434\u0430\u043D\u043D\u044B\u043C\u0438, \u043F\u0438\u0442\u0430\u043D\u0438\u0435 \u2014 \u043F\u043E \u0434\u043D\u044F\u043C \u0441 \u0437\u0430\u043F\u0438\u0441\u044F\u043C\u0438. \u0428\u0430\u0433\u0438 \u0437\u0434\u0435\u0441\u044C \u0431\u0435\u0437 \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043E\u043A. \u0412\u0435\u0441 \u2014 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0437\u0430\u043C\u0435\u0440 \u0432 \u043F\u0435\u0440\u0438\u043E\u0434\u0435. \u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u0441\u0440\u0430\u0432\u043D\u0438\u0432\u0430\u0435\u0442 \u043F\u0435\u0440\u0432\u044B\u0435 \u0438 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u043D\u0430 \u0433\u0440\u0430\u0444\u0438\u043A\u0435. \u041F\u0440\u043E\u043F\u0443\u0441\u043A\u0438 \u043D\u0435 \u0441\u0447\u0438\u0442\u0430\u044E\u0442\u0441\u044F \u043D\u0443\u043B\u0451\u043C. \u041F\u0443\u043D\u043A\u0442\u0438\u0440 \u0438 \u0448\u0442\u0440\u0438\u0445\u043E\u0432\u043A\u0430 \u043E\u0442\u043C\u0435\u0447\u0430\u044E\u0442 \u043D\u0435\u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D\u043D\u044B\u0439 \u0438\u043D\u0442\u0435\u0440\u0432\u0430\u043B. \u0412 \u0440\u0435\u0436\u0438\u043C\u0435 \xAB\u041F\u043E \u0434\u043D\u044F\u043C\xBB \u043A\u043E\u0441\u043D\u0438\u0441\u044C \u0442\u043E\u0447\u043A\u0438 \u0438\u043B\u0438 \u0441\u0442\u043E\u043B\u0431\u0446\u0430, \u0447\u0442\u043E\u0431\u044B \u043E\u0442\u043A\u0440\u044B\u0442\u044C \u044D\u0442\u043E\u0442 \u0434\u0435\u043D\u044C.</p></details></div></main>`;
}
var dateText, number, time, valueText, metricName, unitName, metricKind, stepUnit, signed, shortDate;
var init_period_view = __esm({
  "dashboard/dist/src/period-view.js?v=bdc75e187339"() {
    "use strict";
    init_data();
    init_period_model();
    dateText = (key, options = { day: "numeric", month: "short" }) => new Intl.DateTimeFormat("ru-RU", { timeZone: "UTC", ...options }).format(/* @__PURE__ */ new Date(`${key}T12:00:00Z`));
    number = (value) => value === null ? "\u2014" : numberText(Math.round(value));
    time = (value) => {
      const total = Math.round(value);
      return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
    };
    valueText = (metric, value) => value === null ? "\u2014" : metric === "sleep" ? time(value) : metric === "weight" ? value.toFixed(1).replace(".", ",") : number(value);
    metricName = { sleep: "\u0421\u043E\u043D", steps: "\u0428\u0430\u0433\u0438", nutrition: "\u0421\u044A\u0435\u0434\u0435\u043D\u043E", weight: "\u0412\u0435\u0441" };
    unitName = { sleep: "\u0447:\u043C\u0438\u043D \u0437\u0430 \u043D\u043E\u0447\u044C", steps: "\u0448\u0430\u0433\u043E\u0432/\u0434\u0435\u043D\u044C", nutrition: "\u043A\u043A\u0430\u043B/\u0434\u0435\u043D\u044C", weight: "\u043A\u0433" };
    metricKind = { sleep: "line", steps: "bars", nutrition: "bars", weight: "dots" };
    stepUnit = (value) => {
      const n = Math.round(value), mod100 = n % 100, mod10 = n % 10;
      return mod100 >= 11 && mod100 <= 14 ? "\u0448\u0430\u0433\u043E\u0432" : mod10 === 1 ? "\u0448\u0430\u0433" : mod10 >= 2 && mod10 <= 4 ? "\u0448\u0430\u0433\u0430" : "\u0448\u0430\u0433\u043E\u0432";
    };
    signed = (value, unit) => `${value > 0 ? "+" : value < 0 ? "\u2212" : ""}${Math.abs(value).toLocaleString("ru-RU")}${unit}`;
    shortDate = (key, options) => dateText(key, options).replace(/\./g, "");
  }
});

// dashboard/dist/src/live-sleep.js?v=d66495dd037c
function liveWellnessPage() {
  const today2 = moscowDate2();
  return `<main class="page live-sleep-page"><div class="content-shell"><section class="live-sleep-hero"><div class="eyebrow">\u041B\u0418\u0427\u041D\u042B\u0415 \u0414\u0410\u041D\u041D\u042B\u0415</div><h1>\u041C\u043E\u0438 \u0434\u0430\u043D\u043D\u044B\u0435</h1><p>\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u0435\u043B\u0438 Garmin \u0437\u0430 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u0434\u0435\u043D\u044C</p></section><section class="live-sleep-card"><label for="sleep-date">\u0414\u0430\u0442\u0430 \u0437\u0430\u043F\u0438\u0441\u0438</label><input id="sleep-date" type="date" max="${today2}" value="${previousDate(today2)}" /><p id="live-wellness-status" class="live-sleep-state" role="status" aria-live="polite">\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043C \u0437\u0430\u043F\u0438\u0441\u0438\u2026</p><div class="live-wellness-grid" aria-busy="true">${metrics.map((metric) => `<div class="live-wellness-metric" data-metric="${metric.key}"><span class="live-wellness-label">${metric.label}</span><strong class="live-wellness-value">\u2014</strong><span class="live-wellness-unit">${metric.unit}</span></div>`).join("")}</div><p class="live-sleep-source">\u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A: Garmin \u0447\u0435\u0440\u0435\u0437 Intervals.icu. \u041F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E \u043F\u043E\u043A\u0430\u0437\u0430\u043D \u0432\u0447\u0435\u0440\u0430\u0448\u043D\u0438\u0439 \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D\u043D\u044B\u0439 \u0434\u0435\u043D\u044C; \u043C\u043E\u0436\u043D\u043E \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u0441\u0435\u0433\u043E\u0434\u043D\u044F. \u041F\u0440\u043E\u043F\u0443\u0441\u043A \u043E\u0437\u043D\u0430\u0447\u0430\u0435\u0442, \u0447\u0442\u043E \u0437\u0430\u043F\u0438\u0441\u044C \u043D\u0435 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0430.</p></section><p class="live-sleep-note">\xAB\u0414\u0435\u043D\u044C\xBB \u0438 \xAB\u041F\u0435\u0440\u0438\u043E\u0434\u044B\xBB \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u044E\u0442 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u044B\u0435 \u043B\u0438\u0447\u043D\u044B\u0435 \u0437\u0430\u043F\u0438\u0441\u0438.</p></div></main>`;
}
async function loadLiveWellness(date2) {
  currentRequest?.abort();
  const controller = new AbortController();
  currentRequest = controller;
  const status = document.querySelector("#live-wellness-status");
  const grid = document.querySelector(".live-wellness-grid");
  if (!status || !grid) return;
  status.textContent = "\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043C \u0437\u0430\u043F\u0438\u0441\u0438\u2026";
  grid.setAttribute("aria-busy", "true");
  for (const metric of metrics) grid.querySelector(`[data-metric="${metric.key}"] .live-wellness-value`).textContent = "\u2014";
  try {
    const response = await fetch(`${apiBase}/api/wellness?date=${encodeURIComponent(date2)}`, { credentials: "include", cache: "no-store", signal: controller.signal });
    if (onMyDay && response.status === 403) {
      window.dispatchEvent(new Event("myday:session-expired"));
      return;
    }
    if (!response.ok) throw new Error(response.status === 403 ? "access_denied" : "source_unavailable");
    const data = await response.json();
    if (controller !== currentRequest || !grid.isConnected) return;
    for (const metric of metrics) {
      const value = data[metric.key];
      grid.querySelector(`[data-metric="${metric.key}"] .live-wellness-value`).textContent = Number.isFinite(value) ? metric.format(value) : "\u041D\u0435\u0442 \u0437\u0430\u043F\u0438\u0441\u0438";
    }
    status.textContent = data.state === "missing" ? `\u0417\u0430 ${dateText2(data.date)} \u0437\u0430\u043F\u0438\u0441\u0435\u0439 \u043D\u0435\u0442` : `\u0414\u0430\u043D\u043D\u044B\u0435 \u0437\u0430 ${dateText2(data.date)}${date2 === moscowDate2() ? " \xB7 \u0434\u0435\u043D\u044C \u0435\u0449\u0451 \u0438\u0434\u0451\u0442" : ""}`;
  } catch (error) {
    if (error.name === "AbortError" || controller !== currentRequest || !grid.isConnected) return;
    status.textContent = error.message === "access_denied" ? "\u0412\u0445\u043E\u0434 \u043D\u0435 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0451\u043D. \u041E\u0431\u043D\u043E\u0432\u0438 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443 \u0438 \u0432\u043E\u0439\u0434\u0438 \u0441\u043D\u043E\u0432\u0430." : "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0435. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439 \u0435\u0449\u0451 \u0440\u0430\u0437 \u043F\u043E\u0437\u0436\u0435.";
  } finally {
    if (controller === currentRequest && grid.isConnected) grid.setAttribute("aria-busy", "false");
  }
}
var dateText2, moscowDate2, previousDate, currentRequest, metrics;
var init_live_sleep = __esm({
  "dashboard/dist/src/live-sleep.js?v=d66495dd037c"() {
    "use strict";
    init_api_config();
    dateText2 = (iso2) => new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(/* @__PURE__ */ new Date(`${iso2}T12:00:00Z`)).replace(/\sг\.$/, "");
    moscowDate2 = () => {
      const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Moscow", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(/* @__PURE__ */ new Date()).map((p) => [p.type, p.value]));
      return `${parts.year}-${parts.month}-${parts.day}`;
    };
    previousDate = (iso2) => new Date(Date.parse(`${iso2}T00:00:00Z`) - 864e5).toISOString().slice(0, 10);
    metrics = [
      { key: "sleepMinutes", label: "\u0421\u043E\u043D", unit: "\u0447:\u043C\u0438\u043D", format: (value) => `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}` },
      { key: "steps", label: "\u0428\u0430\u0433\u0438", unit: "\u0437\u0430 \u0434\u0435\u043D\u044C", format: (value) => Math.round(value).toLocaleString("ru-RU") },
      { key: "hrvMs", label: "\u0412\u0430\u0440\u0438\u0430\u0431\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u043F\u0443\u043B\u044C\u0441\u0430", unit: "\u043C\u0441 \xB7 rMSSD", format: (value) => Math.round(value).toLocaleString("ru-RU") },
      { key: "restingPulse", label: "\u041F\u0443\u043B\u044C\u0441 \u043F\u043E\u043A\u043E\u044F", unit: "\u0443\u0434/\u043C\u0438\u043D", format: (value) => Math.round(value).toLocaleString("ru-RU") }
    ];
  }
});

// dashboard/dist/src/insight-view.js?v=22f6fa7374a5
function dayInsight(day) {
  const insight = day?.insight;
  if (!insight || typeof insight !== "object") return null;
  const kind = day.date === day.calendarToday ? "recommendation" : "retrospective";
  const selected = insight[kind];
  if (selected && typeof selected === "object") return selected;
  if (typeof insight.text === "string" && (!insight.kind || insight.kind === kind)) return insight;
  return null;
}
function textParagraphs(value) {
  if (typeof value !== "string") return [];
  return value.replace(/\r\n?/g, "\n").split(/\n\s*\n/).map((paragraph) => paragraph.replace(/\s+/g, " ").trim()).filter(Boolean);
}
function paragraphHTML(text) {
  return textParagraphs(text).map((paragraph) => `<p>${escapeText(paragraph)}</p>`).join("");
}
function cardInsightHTML(insight, card2, current) {
  const text = insight?.cards?.[card2];
  if (textParagraphs(text).join(" ") === textParagraphs(insight?.text).join(" ")) return "";
  const paragraphs = paragraphHTML(text);
  if (!paragraphs) return "";
  return `<section class="detail-ai" aria-label="${current ? "\u0421\u043E\u0432\u0435\u0442 \u043D\u0430 \u0434\u0435\u043D\u044C" : "\u0418\u0442\u043E\u0433 \u0434\u043D\u044F"}"><span class="day-ai-label">${current ? "\u041D\u0430 \u0441\u0435\u0433\u043E\u0434\u043D\u044F" : "\u0418\u0442\u043E\u0433 \u0434\u043D\u044F"}</span>${paragraphs}</section>`;
}
var escapeText;
var init_insight_view = __esm({
  "dashboard/dist/src/insight-view.js?v=22f6fa7374a5"() {
    "use strict";
    escapeText = (value) => value.replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }
});

// dashboard/dist/src/app.js?v=c0040dce8315
var app_exports = {};
__export(app_exports, {
  render: () => render
});
function navItem(page, label, symbol) {
  return `<button class="nav-item ${state.page === page ? "active" : ""}" data-page="${page}" aria-current="${state.page === page ? "page" : "false"}">${icon(symbol, 22)}<span>${label}</span></button>`;
}
function header() {
  return `<header class="topbar"><div class="topbar-inner"><a class="brand" href="#sleep"><span class="brand-leaf">\u2726</span><span>\u043C\u043E\u0439 \u0434\u0435\u043D\u044C</span></a><nav class="desktop-nav" aria-label="\u041E\u0441\u043D\u043E\u0432\u043D\u0430\u044F \u043D\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044F">${navItem("sleep", "\u041C\u043E\u0438 \u0434\u0430\u043D\u043D\u044B\u0435", "moon")}${navItem("today", overviewLabel(), "home")}${navItem("periods", "\u041F\u0435\u0440\u0438\u043E\u0434\u044B", "calendar")}</nav></div></header>`;
}
function bottomNav() {
  return `<nav class="bottom-nav" aria-label="\u041E\u0441\u043D\u043E\u0432\u043D\u0430\u044F \u043D\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044F">${navItem("sleep", "\u041C\u043E\u0438 \u0434\u0430\u043D\u043D\u044B\u0435", "moon")}${navItem("today", overviewLabel(), "home")}${navItem("periods", "\u041F\u0435\u0440\u0438\u043E\u0434\u044B", "calendar")}</nav>`;
}
function todayPage() {
  const nutrition = today.nutrition;
  const energy = today.energy;
  const weight = today.weight;
  const isCurrent = today.date === today.calendarToday;
  const earliest = days.length ? [...days].map((day) => day.date).sort()[0] : today.calendarToday;
  const previous = new Date(Date.parse(`${today.date}T12:00:00Z`) - 864e5).toISOString().slice(0, 10);
  const next = new Date(Date.parse(`${today.date}T12:00:00Z`) + 864e5).toISOString().slice(0, 10);
  const calories = Number.isFinite(nutrition?.calories) ? nutrition.calories : null;
  const insight = dayInsight(today);
  const comment = paragraphHTML(insight?.text);
  return `<main class="page today-page"><div class="content-shell">
    <section class="day-head"><div><h1>\u0414\u0435\u043D\u044C</h1><div class="day-date">${formatDate(today.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}${isCurrent ? '<span class="today-chip">\u0421\u0435\u0433\u043E\u0434\u043D\u044F</span>' : ""}</div></div><div class="day-switch" aria-label="\u0412\u044B\u0431\u043E\u0440 \u0434\u043D\u044F"><button type="button" data-day="${previous}" aria-label="\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0438\u0439 \u0434\u0435\u043D\u044C" ${previous < earliest ? "disabled" : ""}>${icon("left", 19)}</button><input id="day-picker" type="date" value="${today.date}" min="${earliest}" max="${today.calendarToday}" aria-label="\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0434\u0435\u043D\u044C"><button type="button" data-day="${next}" aria-label="\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u0434\u0435\u043D\u044C" ${next > today.calendarToday ? "disabled" : ""}>${icon("chevron", 19)}</button></div></section>
    <div class="day-grid" aria-label="\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u0435\u043B\u0438 \u0437\u0430 ${formatDate(today.date)}">
      <button class="day-card sleep-card" data-detail="sleep"><span class="day-card-icon blue">${icon("moon", 22)}</span><span class="day-card-title">\u0421\u043E\u043D</span><strong class="day-card-value">${Number.isFinite(today.sleep) ? minutesText(today.sleep) : "\u2014"}</strong>${goalBar(today.sleep, 450, "\u0421\u043E\u043D: \u0438\u0437 7 \u0447\u0430\u0441\u043E\u0432 30 \u043C\u0438\u043D\u0443\u0442")}</button>
      <button class="day-card move-card" data-detail="movement"><span class="day-card-icon sage">${icon("walk", 23)}</span><span class="day-card-title">\u0428\u0430\u0433\u0438</span><span class="day-card-subtitle">\u0432\u043D\u0435 \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043E\u043A</span><strong class="day-card-value">${Number.isFinite(today.steps) ? numberText(today.steps) : "\u2014"}</strong>${stepGoalBar(today.steps, today.stepsTotal)}</button>
      <button class="day-card food-card" data-detail="nutrition"><span class="day-card-icon coral">${icon("food", 22)}</span><span class="day-card-title">\u0421\u044A\u0435\u0434\u0435\u043D\u043E</span><strong class="day-card-value">${calories === null ? "\u2014" : numberText(calories)} <small>\u043A\u043A\u0430\u043B</small></strong>${goalBar(calories, 2300, "\u0421\u044A\u0435\u0434\u0435\u043D\u043E: \u0438\u0437 2300 \u043A\u043A\u0430\u043B")}</button>
      <button class="day-card burn-card" data-detail="energy"><span class="day-card-icon green">${icon("sun", 22)}</span><span class="day-card-title">\u041F\u043E\u0442\u0440\u0430\u0447\u0435\u043D\u043E</span><strong class="day-card-value">${energy ? `\u2248 ${numberText(energy.total)} <small>\u043A\u043A\u0430\u043B</small>` : "\u2014"}</strong>${goalBar(energy?.total, 2e3, "\u041F\u043E\u0442\u0440\u0430\u0447\u0435\u043D\u043E: \u0438\u0437 2000 \u043A\u043A\u0430\u043B")}</button>
    </div>
    ${comment ? `<section class="day-ai" aria-label="${isCurrent ? "\u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u044F \u043D\u0430 \u0434\u0435\u043D\u044C" : "\u0410\u043D\u0430\u043B\u0438\u0437 \u0434\u043D\u044F"}"><span class="day-ai-label">${isCurrent ? "\u041D\u0430 \u0441\u0435\u0433\u043E\u0434\u043D\u044F" : "\u0418\u0442\u043E\u0433 \u0434\u043D\u044F"}</span>${comment}</section>` : ""}
    <div class="day-meta"><span>${weight ? `\u0412\u0435\u0441 ${weight.kg.toFixed(1).replace(".", ",")} \u043A\u0433 \xB7 \u0437\u0430\u043C\u0435\u0440 ${formatDate(weight.measuredAt.slice(0, 10), { day: "numeric", month: "short" })}` : "\u0414\u0430\u043D\u043D\u044B\u0445 \u043E \u0432\u0435\u0441\u0435 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442"}</span><span>${updatedLabel()}</span></div>
  </div></main>`;
}
function periodsPage() {
  return renderPeriods(state, icon);
}
function detailContent(name) {
  const blocks = {
    sleep: { title: "\u0421\u043E\u043D", symbol: "moon", tone: "blue", value: minutesText(today.sleep), description: "\u041E\u0440\u0438\u0435\u043D\u0442\u0438\u0440 \u2014 7 \u0447 30 \u043C \u0441\u043D\u0430.", rows: [["\u0412\u0430\u0440\u0438\u0430\u0431\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u043F\u0443\u043B\u044C\u0441\u0430", today.hrv == null ? "\u041D\u0435\u0442 \u0437\u0430\u043F\u0438\u0441\u0438" : `${numberText(today.hrv)} \u043C\u0441`], ["\u041F\u0443\u043B\u044C\u0441 \u043F\u043E\u043A\u043E\u044F", today.restingPulse == null ? "\u041D\u0435\u0442 \u0437\u0430\u043F\u0438\u0441\u0438" : `${numberText(today.restingPulse)} \u0443\u0434/\u043C\u0438\u043D`]], source: "Garmin \u0447\u0435\u0440\u0435\u0437 Intervals.icu" },
    movement: { title: "\u0428\u0430\u0433\u0438", symbol: "walk", tone: "sage", value: numberText(today.steps), description: "\u041E\u0440\u0438\u0435\u043D\u0442\u0438\u0440 \u2014 10 400 \u0448\u0430\u0433\u043E\u0432, \u0432\u043A\u043B\u044E\u0447\u0430\u044F \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0438.", rows: Number.isFinite(today.stepsTotal) ? [["\u0412\u0441\u0435\u0433\u043E \u0437\u0430 \u0434\u0435\u043D\u044C", numberText(today.stepsTotal)], ["\u041D\u0430 \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0430\u0445", Number.isFinite(today.steps) ? numberText(today.stepsTotal - today.steps) : "\u041D\u0435\u0442 \u043E\u0446\u0435\u043D\u043A\u0438"]] : [], source: "Garmin \u0447\u0435\u0440\u0435\u0437 Intervals.icu" },
    nutrition: { title: "\u0421\u044A\u0435\u0434\u0435\u043D\u043E", symbol: "food", tone: "coral", value: today.nutrition ? `${numberText(today.nutrition.calories)} \u043A\u043A\u0430\u043B` : "\u041D\u0435\u0442 \u0437\u0430\u043F\u0438\u0441\u0438", description: "\u041E\u0440\u0438\u0435\u043D\u0442\u0438\u0440 \u2014 2300 \u043A\u043A\u0430\u043B \u0432 \u0434\u0435\u043D\u044C.", rows: today.nutrition ? [["\u0411\u0435\u043B\u043A\u0438", `${numberText(today.nutrition.protein)} \u0433`], ["\u0416\u0438\u0440\u044B", `${numberText(today.nutrition.fat)} \u0433`], ["\u0423\u0433\u043B\u0435\u0432\u043E\u0434\u044B", `${numberText(today.nutrition.carbs)} \u0433`], ["\u0417\u0430\u043F\u0438\u0441\u0435\u0439", numberText(today.nutrition.entries)]] : [], source: "FatSecret" },
    energy: { title: "\u041E\u0446\u0435\u043D\u043A\u0430 \u0440\u0430\u0441\u0445\u043E\u0434\u0430", symbol: "info", tone: "sage", value: today.energy ? `\u2248 ${numberText(today.energy.total)} \u043A\u043A\u0430\u043B` : "\u041D\u0435\u0442 \u043E\u0446\u0435\u043D\u043A\u0438", description: `${today.date === today.calendarToday ? "\u041E\u0446\u0435\u043D\u043A\u0430 \u043A \u0442\u0435\u043A\u0443\u0449\u0435\u043C\u0443 \u043C\u043E\u043C\u0435\u043D\u0442\u0443 \u0434\u043D\u044F." : "\u041E\u0446\u0435\u043D\u043A\u0430 \u0437\u0430 \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D\u043D\u044B\u0439 \u0434\u0435\u043D\u044C."} \u041E\u0440\u0438\u0435\u043D\u0442\u0438\u0440 \u2014 2000 \u043A\u043A\u0430\u043B.`, rows: today.energy ? [["\u041E\u0441\u043D\u043E\u0432\u043D\u043E\u0439 \u043E\u0431\u043C\u0435\u043D", `${numberText(today.energy.resting)} \u043A\u043A\u0430\u043B`], ["\u0424\u043E\u043D\u043E\u0432\u0430\u044F \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u044C", `${numberText(today.energy.background)} \u043A\u043A\u0430\u043B`], ["\u0422\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0438", `${numberText(today.energy.workout)} \u043A\u043A\u0430\u043B`], ["\u0425\u043E\u0434\u044C\u0431\u0430", `${numberText(today.energy.walking)} \u043A\u043A\u0430\u043B`]] : [], source: "\u0420\u0430\u0441\u0447\u0451\u0442 \u043F\u043E Garmin \u0438 Withings" }
  };
  const d = blocks[name];
  return `<div class="modal-backdrop" data-close="true"><section class="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title"><button class="modal-close" data-close="true" aria-label="\u0417\u0430\u043A\u0440\u044B\u0442\u044C">${icon("close", 20)}</button><span class="icon-orb ${d.tone}">${icon(d.symbol, 25)}</span><h2 id="detail-title">${d.title}</h2><div class="detail-value">${d.value}</div><p>${d.description}</p>${cardInsightHTML(dayInsight(today), name, today.date === today.calendarToday)}<div class="detail-rows">${d.rows.map(([k, v]) => `<div><span>${k}</span><strong>${v}</strong></div>`).join("")}</div><div class="detail-updated">${updatedLabel()}</div><details class="detail-source"><summary>\u041E\u0431 \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A\u0435</summary><p>${d.source}</p></details></section></div>`;
}
function render() {
  if (!authenticated) return;
  app.innerHTML = `${header()}${state.page === "periods" ? periodsPage() : state.page === "sleep" ? liveWellnessPage() : todayPage()}${bottomNav()}${state.detail ? detailContent(state.detail) : ""}`;
  document.body.classList.toggle("modal-open", !!state.detail);
  for (const element of app.querySelectorAll(".topbar, main, .bottom-nav")) element.toggleAttribute("inert", !!state.detail);
  if (state.detail) app.querySelector(".modal-close")?.focus();
  if (state.page === "sleep") loadLiveWellness(app.querySelector("#sleep-date").value);
}
function closeDetail() {
  const returnTo = detailReturn;
  state.detail = null;
  render();
  if (returnTo) app.querySelector(`[data-detail="${returnTo}"]`)?.focus();
}
var app, state, detailReturn, dateFromISO, formatDate, goalBar, stepGoalBar, overviewLabel, updatedLabel, icon;
var init_app = __esm({
  "dashboard/dist/src/app.js?v=c0040dce8315"() {
    "use strict";
    init_data();
    init_period_view();
    init_live_sleep();
    init_api_config();
    init_insight_view();
    app = document.querySelector("#app");
    state = { page: ["today", "periods", "sleep"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "today", mode: "week", detail: null };
    detailReturn = null;
    dateFromISO = (iso2) => /* @__PURE__ */ new Date(`${iso2}T12:00:00Z`);
    formatDate = (iso2, options = { day: "numeric", month: "long", year: "numeric" }) => new Intl.DateTimeFormat("ru-RU", { timeZone: "UTC", ...options }).format(dateFromISO(iso2)).replace(/\sг\.$/, "");
    goalBar = (value, goal, label) => Number.isFinite(value) ? `<span class="day-card-bar" role="progressbar" aria-valuenow="${Math.round(value)}" aria-valuemin="0" aria-valuemax="${goal}" aria-label="${label}"><i style="width:${Math.min(100, Math.max(0, value / goal * 100))}%"></i></span>` : "";
    stepGoalBar = (outside, total) => {
      if (!Number.isFinite(outside) || !Number.isFinite(total) || total < outside) return "";
      const basic = Math.min(100, outside / 10400 * 100);
      const workout = Math.min(100 - basic, (total - outside) / 10400 * 100);
      return `<span class="day-card-bar step-bar" role="progressbar" aria-valuenow="${Math.round(total)}" aria-valuemin="0" aria-valuemax="10400" aria-label="\u0412\u0441\u0435 \u0448\u0430\u0433\u0438, \u0432\u043A\u043B\u044E\u0447\u0430\u044F \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0438: \u0438\u0437 10 400"><i style="width:${basic}%"></i><em style="width:${workout}%"></em></span>`;
    };
    overviewLabel = () => "\u0414\u0435\u043D\u044C";
    updatedLabel = () => today.updatedAt ? `\u0414\u0430\u043D\u043D\u044B\u0435 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u044B ${new Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Moscow", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(today.updatedAt))}` : "\u0412\u0440\u0435\u043C\u044F \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u043E";
    icon = (name, size = 24) => {
      const common = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;
      const paths = {
        home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
        calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
        layers: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
        moon: '<path d="M20.5 14.1A8.5 8.5 0 0 1 9.9 3.5 8.6 8.6 0 1 0 20.5 14.1Z" fill="currentColor" stroke="none"/>',
        walk: '<circle cx="14" cy="3.5" r="1.8"/><path d="m12.5 6.5-2.7 5 3.1 2.2M10.9 8.6 6.5 11M11.6 8.1l3.5 2.7 3.3.4M12.9 13.7l-3.6 4.7-2.8 2.1M12.9 13.7l4.2 2.7 2.1 4.1"/>',
        food: '<path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v18M18 21V3c-4 2-5 7-5 11h5"/>',
        chevron: '<path d="m9 5 7 7-7 7"/>',
        left: '<path d="m15 5-7 7 7 7"/>',
        info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
        close: '<path d="M5 5 19 19M19 5 5 19"/>',
        sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
        weight: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M9 9a3 3 0 0 1 6 0l-3 2z"/>',
        check: '<path d="m4 12 5 5L20 6"/>',
        clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
      };
      return `<svg ${common}>${paths[name]}</svg>`;
    };
    app.addEventListener("click", (e) => {
      const page = e.target.closest("[data-page]");
      if (page) {
        state.page = page.dataset.page;
        state.detail = null;
        location.hash = state.page;
        window.scrollTo(0, 0);
        render();
        return;
      }
      const day = e.target.closest("[data-day]");
      if (day && !day.disabled && selectDay(day.dataset.day)) {
        state.page = "today";
        state.detail = null;
        location.hash = "today";
        window.scrollTo(0, 0);
        render();
        return;
      }
      const detail = e.target.closest("[data-detail]");
      if (detail) {
        detailReturn = detail.dataset.detail;
        state.detail = detail.dataset.detail;
        render();
        return;
      }
      if (e.target.matches(".modal-backdrop") || e.target.closest(".modal-close")) {
        closeDetail();
        return;
      }
      const mode = e.target.closest("[data-mode]");
      if (mode) {
        state.mode = mode.dataset.mode;
        render();
        return;
      }
    });
    app.addEventListener("change", (e) => {
      if (e.target.id === "sleep-date") loadLiveWellness(e.target.value);
      if (e.target.id === "day-picker" && selectDay(e.target.value)) render();
    });
    window.addEventListener("hashchange", () => {
      const page = location.hash.slice(1);
      if (["today", "periods", "sleep"].includes(page) && page !== state.page) {
        state.page = page;
        state.detail = null;
        render();
      }
    });
    window.addEventListener("keydown", (e) => {
      if (!state.detail) return;
      if (e.key === "Escape") {
        closeDetail();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = [...app.querySelectorAll(".detail-modal button, .detail-modal summary")];
      const first = focusable[0], last = focusable.at(-1);
      if (e.shiftKey && (document.activeElement === first || !focusable.includes(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !focusable.includes(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    });
    render();
  }
});

// dashboard/dist/src/boot.js
init_api_config();

// dashboard/dist/src/api-request.js?v=c6956226768a
async function requestWithDeadline(url, options = {}, readResponse = (response) => response, { timeoutMs = 12e3, fetchImpl = fetch } = {}) {
  const controller = new AbortController();
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new DOMException("Request timed out", "TimeoutError");
      reject(error);
      controller.abort(error);
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      Promise.resolve().then(() => fetchImpl(url, { ...options, signal: controller.signal })).then(readResponse),
      deadline
    ]);
  } finally {
    clearTimeout(timer);
  }
}
async function dashboardResponse(response, { isProtected, onSessionExpired }) {
  if (isProtected && response.status === 403) {
    onSessionExpired();
    throw new Error("session_expired");
  }
  if (!response.ok) throw new Error("data_unavailable");
  return response.json();
}

// dashboard/dist/src/pwa.js?v=c1ea3f5be5fc
function registerPwa(win = window, nav = navigator) {
  if (!win.isSecureContext || !nav.serviceWorker) return;
  const register = () => {
    nav.serviceWorker.register("./sw.js", { scope: "./", updateViaCache: "none" }).then(() => console.info("My Day: web app service worker registered")).catch(() => console.warn("My Day: web app registration unavailable; browser mode still works"));
  };
  if (win.document.readyState === "complete") register();
  else win.addEventListener("load", register, { once: true });
}

// dashboard/dist/src/boot.js
registerPwa();
var app2 = document.querySelector("#app");
var dashboardModule;
var loaded = false;
async function fetchApi(path, options = {}, readResponse) {
  return requestWithDeadline(`${apiBase}${path}`, options, readResponse);
}
function showConnectionError() {
  setAuthenticated(false);
  app2.innerHTML = '<main class="pin-page"><section class="pin-card"><h1>\u041D\u0435\u0442 \u0441\u0432\u044F\u0437\u0438 \u0441 \u0441\u0435\u0440\u0432\u0435\u0440\u043E\u043C \u0434\u0430\u043D\u043D\u044B\u0445</h1><p>\u0421\u0430\u0439\u0442 \u043E\u0442\u043A\u0440\u044B\u043B\u0441\u044F, \u043D\u043E \u0441\u0435\u0440\u0432\u0435\u0440 \u0432\u0445\u043E\u0434\u0430 \u0441\u0435\u0439\u0447\u0430\u0441 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D. \u041F\u0440\u043E\u0432\u0435\u0440\u044C \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u0438 \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0439 \u0435\u0449\u0451 \u0440\u0430\u0437.</p><button type="button" id="retry-session">\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C</button></section></main>';
  app2.querySelector("#retry-session").addEventListener("click", checkSession);
}
async function checkSession() {
  app2.innerHTML = '<main class="pin-page"><p class="pin-loading" role="status">\u041F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u043C \u0432\u0445\u043E\u0434\u2026</p></main>';
  try {
    const response = await fetchApi("/api/auth/session", { credentials: "include", cache: "no-store" });
    if (response.ok) await showDashboard();
    else showLogin();
  } catch {
    showConnectionError();
  }
}
async function loadDashboard() {
  const payload = await fetchApi("/api/dashboard", { credentials: "include", cache: "no-store" }, (response) => dashboardResponse(response, {
    isProtected: onMyDay,
    onSessionExpired: () => window.dispatchEvent(new Event("myday:session-expired"))
  }));
  const { setDashboard: setDashboard2 } = await Promise.resolve().then(() => (init_data(), data_exports));
  setDashboard2(payload);
  loaded = true;
  if (dashboardModule) dashboardModule.render();
}
async function showDashboard() {
  setAuthenticated(true);
  app2.innerHTML = '<main class="pin-page"><p class="pin-loading" role="status">\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043C \u043B\u0438\u0447\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435\u2026</p></main>';
  try {
    await loadDashboard();
    if (!dashboardModule) dashboardModule = await Promise.resolve().then(() => (init_app(), app_exports));
    else dashboardModule.render();
  } catch (error) {
    if (error.message === "session_expired") return;
    app2.innerHTML = '<main class="pin-page"><section class="pin-card"><h1>\u0414\u0430\u043D\u043D\u044B\u0435 \u043F\u043E\u043A\u0430 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B</h1><p>\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0437\u0430\u043F\u0438\u0441\u0438. \u041F\u0440\u043E\u0432\u0435\u0440\u044C \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0435 \u0438 \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0439 \u0435\u0449\u0451 \u0440\u0430\u0437.</p><button type="button" id="retry-dashboard">\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C</button></section></main>';
    app2.querySelector("#retry-dashboard").addEventListener("click", showDashboard);
    return;
  }
}
function showLogin(message = "") {
  setAuthenticated(false);
  app2.innerHTML = `<main class="pin-page"><section class="pin-card"><div class="eyebrow">\u041C\u041E\u0419 \u0414\u0415\u041D\u042C</div><h1>\u0412\u0445\u043E\u0434</h1><p>\u0412\u0432\u0435\u0434\u0438 \u0441\u0432\u043E\u0439 \u0448\u0435\u0441\u0442\u0438\u0437\u043D\u0430\u0447\u043D\u044B\u0439 PIN-\u043A\u043E\u0434.</p><form id="pin-form"><label for="pin-input">PIN-\u043A\u043E\u0434</label><input id="pin-input" type="password" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" minlength="6" required aria-describedby="pin-message" /><button type="submit">\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043C\u043E\u0439 \u0434\u0435\u043D\u044C</button></form><p id="pin-message" class="pin-message" role="status"></p></section></main>`;
  const input = app2.querySelector("#pin-input");
  const status = app2.querySelector("#pin-message");
  status.textContent = message;
  app2.querySelector("#pin-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const pin = input.value;
    if (!/^\d{6}$/.test(pin)) return;
    const button = event.target.querySelector("button");
    button.disabled = true;
    status.textContent = "\u041F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u043C PIN-\u043A\u043E\u0434\u2026";
    try {
      const response = await fetchApi("/api/auth/login", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin })
      });
      input.value = "";
      if (response.ok) {
        await showDashboard();
        return;
      }
      status.textContent = response.status === 429 ? "\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u043D\u043E\u0433\u043E \u043F\u043E\u043F\u044B\u0442\u043E\u043A. \u041F\u043E\u0434\u043E\u0436\u0434\u0438 15 \u043C\u0438\u043D\u0443\u0442." : response.status === 401 ? "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 PIN-\u043A\u043E\u0434." : "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0432\u043E\u0439\u0442\u0438. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439 \u043F\u043E\u0437\u0436\u0435.";
    } catch {
      status.textContent = "\u041D\u0435 \u0443\u0434\u0430\u0451\u0442\u0441\u044F \u0441\u0432\u044F\u0437\u0430\u0442\u044C\u0441\u044F \u0441 \u0441\u0435\u0440\u0432\u0435\u0440\u043E\u043C \u0434\u0430\u043D\u043D\u044B\u0445. \u041F\u0440\u043E\u0432\u0435\u0440\u044C \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435.";
    }
    button.disabled = false;
    input.focus();
  });
  input.focus();
}
if (!onMyDay) showDashboard();
else {
  checkSession();
  window.addEventListener("myday:session-expired", () => showLogin("\u0421\u0435\u0430\u043D\u0441 \u0437\u0430\u043A\u043E\u043D\u0447\u0438\u043B\u0441\u044F. \u0412\u0432\u0435\u0434\u0438 PIN-\u043A\u043E\u0434 \u0435\u0449\u0451 \u0440\u0430\u0437."));
}
setInterval(() => {
  if (loaded && !document.hidden) loadDashboard().catch(() => {
  });
}, 30 * 60 * 1e3);
document.addEventListener("visibilitychange", () => {
  if (loaded && !document.hidden) loadDashboard().catch(() => {
  });
});
