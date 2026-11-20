// Ebnely — تحميل البيانات + دمج تعديلات الأدمن المحفوظة محلياً
async function loadData() {
  const res = await fetch("data/prices.json", { cache: "no-store" });
  const base = await res.json();
  try {
    const ov = JSON.parse(localStorage.getItem("ebnely_overrides") || "null");
    if (ov && Array.isArray(ov.items)) {
      const map = new Map(ov.items.map(i => [i.id, i]));
      base.items = base.items.map(it => map.get(it.id) || it);
      // بنود جديدة أضافها الأدمن
      ov.items.forEach(it => { if (!base.items.find(x => x.id === it.id)) base.items.push(it); });
    }
    if (ov && ov.settings) {
      if (ov.settings.whatsapp) window.EBNELY_CONFIG.whatsapp = ov.settings.whatsapp;
      if (ov.settings.appNameAr) window.EBNELY_CONFIG.appNameAr = ov.settings.appNameAr;
    }
    if (localStorage.getItem("ebnely_admin_password")) {
      window.EBNELY_CONFIG.adminPassword = localStorage.getItem("ebnely_admin_password");
    }
  } catch (e) { console.warn("overrides", e); }
  return base;
}
function fmt(n) { return Number(n || 0).toLocaleString("en-US"); }
function levelLabel(k) {
  return { economy: "اقتصادي", medium: "متوسط", lux: "لوكس", super_lux: "سوبر لوكس" }[k] || k;
}
function waLink(text) {
  const n = (window.EBNELY_CONFIG && window.EBNELY_CONFIG.whatsapp) || "";
  return "https://wa.me/" + n + "?text=" + encodeURIComponent(text || "سلام، عايز استفسر عن أسعار التشطيب من Ebnely (ابنيلي)");
}
