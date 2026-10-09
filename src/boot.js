import { apiBase, onMyDay, setAuthenticated } from './api-config.js';

const app = document.querySelector('#app');
let dashboardModule;

async function showDashboard() {
  setAuthenticated(true);
  if (!dashboardModule) dashboardModule = await import('./app.js');
  else dashboardModule.render();
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
      const response = await fetch(`${apiBase}/api/auth/login`, {
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
  app.innerHTML = '<main class="pin-page"><p class="pin-loading" role="status">Проверяем вход…</p></main>';
  fetch(`${apiBase}/api/auth/session`, { credentials: 'include', cache: 'no-store' })
    .then(response => response.ok ? showDashboard() : showLogin())
    .catch(() => showLogin('Не удаётся связаться с сервером данных. Проверь подключение.'));
  window.addEventListener('myday:session-expired', () => showLogin('Сеанс закончился. Введи PIN-код ещё раз.'));
}
