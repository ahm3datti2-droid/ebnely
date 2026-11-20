// Ebnely — Service Worker (PWA) v2
// إصلاح: v1 كان بيقدّم نسخة قديمة مخزّنة من الصفحات (منها الحاسبة).
// v2: الصفحات HTML بتتجب من الشبكة أولاً، والكاش بديل بس لو مفيش نت.
// أي تحديث جديد للملفات لازم يغيّر رقم النسخة هنا عشان الكاش القديم يتمسح.
const CACHE = "ebnely-v2";
const CORE = ["index.html", "calculator.html", "category.html", "item.html", "admin.html", "css/style.css", "js/config.js", "js/data.js", "js/app.js", "js/calculator.js", "js/admin.js", "data/prices.json", "manifest.json"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(()=>{})); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  const isPage = e.request.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname === "/";
  if (isPage) {
    // صفحات: شبكة أولاً
    e.respondWith(fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match("index.html"))));
    return;
  }
  // ملفات ثابتة (css/js/json): كاش أولاً مع تحديث في الخلفية
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
    return res;
  }).catch(() => caches.match("index.html"))));
});
