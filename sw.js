// Ebnely — Service Worker (PWA) v3
// إصلاح: v1 كان بيقدّم نسخة قديمة مخزّنة من الصفحات (منها الحاسبة).
// v2: الصفحات HTML بتتجب من الشبكة أولاً، والكاش بديل بس لو مفيش نت.
// v3: طلبات النشر (POST /api) مبتتكاشّش أبداً — شبكة فقط.
// أي تحديث جديد للملفات لازم يغيّر رقم النسخة هنا عشان الكاش القديم يتمسح.
const CACHE = "ebnely-v3";
const CORE = ["index.html", "calculator.html", "category.html", "item.html", "admin.html", "css/style.css", "js/config.js", "js/data.js", "js/app.js", "js/calculator.js", "js/admin.js", "data/prices.json", "manifest.json"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(()=>{})); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener("fetch", e => {
  // طلبات النشر والحفظ (POST) — شبكة فقط، من غير كاش خالص
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.pathname.startsWith("/api/")) return;
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
