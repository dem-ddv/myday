// Public, fictional fixtures only. Replace this module with a protected API adapter later.
export const DEMO_DATE = '2026-10-07';

export const today = {
  date: DEMO_DATE,
  sleep: { minutes: 438, targetMinutes: 480, hrv: 48, restingPulse: 56, source: 'Garmin через Intervals.icu', updated: '07:12', state: 'complete' },
  movement: { steps: 8420, target: 10000, workout: { title: 'Лёгкая пробежка', distanceKm: 4.9, durationMinutes: 32, time: '18:10' }, source: 'Garmin через Intervals.icu', updated: '18:48', state: 'complete' },
  nutrition: { calories: 1560, protein: 86, carbs: 174, fat: 52, entries: 3, source: 'FatSecret', updated: '15:20', state: 'partial' },
  energy: { total: 2150, resting: 1515, background: 152, workout: 300, walking: 183, source: 'Расчёт по Garmin и весу', updated: '18:48', state: 'estimate' },
  weight: { kg: 65.0, source: 'Withings', measuredAt: '2026-10-06T07:20:00+03:00', state: 'stale' },
  mood: { value: null, source: 'Ручная запись', updated: null, state: 'missing' },
};

// Each series is fictional; null means no observation, never zero.
export const periods = [
  { key: '2026-10', label: 'Октябрь 2026', comparison: '1–7 октября и 1–7 сентября', currentDays: 7, previousDays: 7, completed: false,
    sleep: [438, 412, 460, 425, 447, 433, 438], previousSleep: [465, 470, 458, 481, 462, 466, 471],
    steps: [7730, 8240, 7600, 9020, 8420, 9510, 8420], previousSteps: [7130, 7450, 6950, 7640, 7180, 8030, 8120],
    foodLogged: [true, true, true, true, false, true, true], previousFoodLogged: [true, true, false, true, true, false, false],
    weight: [65.4, null, 65.2, null, 65.1, 65.0, null], previousWeight: [65.6, null, 65.5, null, 65.4, null, 65.3],
    sleepCoverage: 7, stepsCoverage: 7, foodCoverage: 6, weightCoverage: 4 },
  { key: '2026-09', label: 'Сентябрь 2026', comparison: '1–30 сентября и 1–31 августа', currentDays: 30, previousDays: 31, completed: true,
    sleep: [null, 448, 455, 461, 452, 470, 467, 443, 449, 453, 466, 459, 475, 458, 451, 465, 440, 449, 456, 473, 463, 455, 468, 460, 446, 457, 470, 452, 461, 465],
    previousSleep: Array.from({length:31}, (_,i) => 440 + ((i * 13) % 37)),
    steps: Array.from({length:30}, (_,i) => 7150 + ((i * 823) % 2900)),
    previousSteps: Array.from({length:31}, (_,i) => 6750 + ((i * 719) % 2650)),
    foodLogged: Array.from({length:30}, (_,i) => i !== 5 && i !== 18 && i !== 25), previousFoodLogged: Array.from({length:31}, (_,i) => i % 7 !== 0),
    weight: Array.from({length:30}, (_,i) => i % 3 === 0 ? 65.7 - i * .012 : null), previousWeight: Array.from({length:31}, (_,i) => i % 3 === 0 ? 66.1 - i * .012 : null),
    sleepCoverage: 29, stepsCoverage: 30, foodCoverage: 27, weightCoverage: 10 },
  { key: '2026-08', label: 'Август 2026', comparison: '1–31 августа и 1–31 июля', currentDays: 31, previousDays: 31, completed: true,
    sleep: Array.from({length:31}, (_,i) => i === 17 ? null : 435 + ((i * 19) % 43)), previousSleep: Array.from({length:31}, (_,i) => 442 + ((i * 11) % 39)),
    steps: Array.from({length:31}, (_,i) => 6750 + ((i * 719) % 2650)), previousSteps: Array.from({length:31}, (_,i) => 6900 + ((i * 587) % 2500)),
    foodLogged: Array.from({length:31}, (_,i) => i % 7 !== 0), previousFoodLogged: Array.from({length:31}, (_,i) => i % 6 !== 0),
    weight: Array.from({length:31}, (_,i) => i % 3 === 0 ? 66.1 - i * .012 : null), previousWeight: Array.from({length:31}, (_,i) => i % 4 === 0 ? 66.4 - i * .009 : null),
    sleepCoverage: 30, stepsCoverage: 31, foodCoverage: 26, weightCoverage: 11 },
];

export function average(values) { const valid = values.filter(v => v !== null && v !== undefined); return valid.length ? valid.reduce((a,b) => a+b,0)/valid.length : null; }
export function minutesText(n) { return `${Math.floor(n/60)} ч ${Math.round(n%60)} м`; }
export function numberText(n) { return Math.round(n).toLocaleString('ru-RU'); }
