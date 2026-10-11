// Network-only worker: no Cache Storage or offline private dashboard.
// Version: myday-pwa-1. Registration checks updates without HTTP cache.
const offlineHtml = `<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f7f5f0"><title>Мой день — нет связи</title><style>body{margin:0;background:#f7f5f0;color:#172a3b;font:18px/1.6 system-ui,sans-serif;min-height:100vh;display:grid;place-items:center}main{box-sizing:border-box;width:min(100%,460px);padding:32px}h1{font-size:30px;line-height:1.2}a{display:inline-block;padding:12px 20px;border-radius:12px;background:#3f7762;color:white;text-decoration:none;font-weight:600}a:focus-visible{outline:3px solid #172a3b;outline-offset:4px}</style><main><h1>Нет связи</h1><p>Для открытия My Day нужен интернет. Проверь подключение и VPN, затем попробуй ещё раз.</p><a href="./">Повторить</a></main></html>`;
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  // API, login/logout, assets and other sites retain normal browser behavior.
  if (request.method !== 'GET' || request.mode !== 'navigate' || url.origin !== scope.origin ||
      !url.pathname.startsWith(scope.pathname)) return;
  event.respondWith((async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      return await fetch(request, { cache: 'no-store', signal: controller.signal });
    } catch {
      return new Response(offlineHtml, {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    } finally { clearTimeout(timeout); }
  })());
});
