import { apiBase, onMyDay, setAuthenticated } from './api-config.js?v=d34637085ebe';

const app = document.querySelector('#app');
let dashboardModule;
let loaded = false;

async function fetchApi(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    return await fetch(`${apiBase}${path}`, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function showConnectionError() {
  setAuthenticated(false);
  app.innerHTML = '<main class="pin-page"><section class="pin-card"><h1>Нет связи с сервером данных</h1><p>Сайт открылся, но сервер входа сейчас недоступен. Проверь подключение и попробуй ещё раз.</p><button type="button" id="retry-session">Повторить</button></section></main>';
  app.querySelector('#retry-session').addEventListener('click', checkSession);
}

async function checkSession() {
  app.innerHTML = '<main class="pin-page"><p class="pin-loading" role="status">Проверяем вход…</p></main>';
  try {
    const response = await fetchApi('/api/auth/session', { credentials: 'include', cache: 'no-store' });
    if (response.ok) await showDashboard();
    else showLogin();
  } catch {
    showConnectionError();
  }
}

async function loadDashboard() {
  const response = await fetchApi('/api/dashboard', { credentials: 'include', cache: 'no-store' });
  if (onMyDay && response.status === 403) { window.dispatchEvent(new Event('myday:session-expired')); throw new Error('session_expired'); }
  if (!response.ok) throw new Error('data_unavailable');
  const payload = await response.json();
  const { setDashboard } = await import('./data.js?v=1b85eb6ad1fa');
  setDashboard(payload);
  loaded = true;
  if (dashboardModule) dashboardModule.render();
}

async function showDashboard() {
  setAuthenticated(true);
  app.innerHTML = '<main class="pin-page"><p class="pin-loading" role="status">Загружаем личные данные…</p></main>';
  try {
    await loadDashboard();
    if (!dashboardModule) dashboardModule = await import('./app.js?v=447a0e16b807');
    else dashboardModule.render();
  }
  catch (error) {
    if (error.message === 'session_expired') return;
    app.innerHTML = '<main class="pin-page"><section class="pin-card"><h1>Данные пока недоступны</h1><p>Не удалось получить записи. Проверь соединение и попробуй ещё раз.</p><button type="button" id="retry-dashboard">Повторить</button></section></main>';
    app.querySelector('#retry-dashboard').addEventListener('click', showDashboard);
    return;
  }
}

function showLogin(message = '') {
  setAuthenticated(false);
  app.innerHTML = `<main class="pin-page"><section class="pin-card"><div class="eyebrow">МОЙ ДЕНЬ</div><h1>Вход</h1><p>Введи свой шестизначный PIN-код.</p><form id="pin-form"><label for="pin-input">PIN-код</label><input id="pin-input" type="password" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" minlength="6" required aria-describedby="pin-message" /><button type="submit">Открыть мой день</button></form><p id="pin-message" class="pin-message" role="status"></p></section></main>`;
  const input = app.querySelector('#pin-input');
  const status = app.querySelector('#pin-message');
  status.textContent = message;
  app.querySelector('#pin-form').addEventListener('submit', async event => {
    event.preventDefault();
    const pin = input.value;
    if (!/^\d{6}$/.test(pin)) return;
    const button = event.target.querySelector('button');
    button.disabled = true;
    status.textContent = 'Проверяем PIN-код…';
    try {
      const response = await fetchApi('/api/auth/login', {
        method: 'POST', credentials: 'include', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }),
      });
      input.value = '';
      if (response.ok) { await showDashboard(); return; }
      status.textContent = response.status === 429 ? 'Слишком много попыток. Подожди 15 минут.' : response.status === 401 ? 'Неверный PIN-код.' : 'Не удалось войти. Попробуй позже.';
    } catch { status.textContent = 'Не удаётся связаться с сервером данных. Проверь подключение.'; }
    button.disabled = false;
    input.focus();
  });
  input.focus();
}

if (!onMyDay) showDashboard();
else {
  checkSession();
  window.addEventListener('myday:session-expired', () => showLogin('Сеанс закончился. Введи PIN-код ещё раз.'));
}

setInterval(() => { if (loaded && !document.hidden) loadDashboard().catch(() => {}); }, 60 * 60 * 1000);
document.addEventListener('visibilitychange', () => { if (loaded && !document.hidden) loadDashboard().catch(() => {}); });
