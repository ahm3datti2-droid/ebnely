// Ebnely — لوحة الأدمن
let DATA = null;
function pwOK(){ return (localStorage.getItem("ebnely_admin_password") || window.EBNELY_CONFIG.adminPassword); }
function doLogin(){
  const v = document.getElementById("pw").value.trim();
  if(v === pwOK()){ sessionStorage.setItem("ebnely_admin","1"); showPanel(); }
  else document.getElementById("loginErr").textContent = "الباسورد غلط — جرّب تاني.";
}
function doLogout(){ sessionStorage.removeItem("ebnely_admin"); location.reload(); }
function showTab(t){
  document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("active", b.dataset.tab===t));
  ["items","categories","bulk","settings","requests"].forEach(x=>document.getElementById("tab-"+x).classList.toggle("hidden", x!==t));
  if(t==="categories") renderCatsAdmin();
}
async function showPanel(){
  document.getElementById("loginBox").classList.add("hidden");
  document.getElementById("panel").classList.remove("hidden");
  DATA = await loadData();
  const cats = DATA.categories;
  document.getElementById("fCat").innerHTML = cats.map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
  document.getElementById("bCat").innerHTML = cats.map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
  document.getElementById("sWa").value = window.EBNELY_CONFIG.whatsapp || "";
  document.getElementById("fCat").onchange = renderItems;
  document.getElementById("fQ").oninput = renderItems;
  renderItems(); renderCatsAdmin();
  const reqs = JSON.parse(localStorage.getItem("ebnely_requests")||"[]");
  document.getElementById("reqList").innerHTML = reqs.length ? reqs.map(r=>`<div class="card" style="margin-top:8px">${r}</div>`).join("") : "<p class='muted'>لا توجد طلبات بعد.</p>";
}
function saveOverrides(){
  localStorage.setItem("ebnely_overrides", JSON.stringify({ items: DATA.items, categories: DATA.categories, settings: { whatsapp: window.EBNELY_CONFIG.whatsapp, appNameAr: window.EBNELY_CONFIG.appNameAr }, saved_at: new Date().toISOString().slice(0,10) }));
}
function refreshCatSelects(){
  const opts = DATA.categories.map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
  document.getElementById("fCat").innerHTML = opts;
  document.getElementById("bCat").innerHTML = opts;
}
function renderCatsAdmin(){
  document.getElementById("catsList").innerHTML = DATA.categories.map(c=>{
    const n = DATA.items.filter(i=>i.category===c.id).length;
    return `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid var(--line)">
      <span>${c.icon||"📁"} <b>${c.name}</b> <span class="muted">— ${n} خدمات</span><br><span class="muted">${c.description||""}</span></span>
      <button class="btn small ghost" onclick="delCategory('${c.id}')">حذف</button></div>`;
  }).join("");
}
function addCategory(){
  const name = document.getElementById("cName").value.trim();
  if(!name){ alert("اكتب اسم القسم الأول."); return; }
  const id = "cat-" + Date.now().toString().slice(-6);
  DATA.categories.push({ id, name, icon: document.getElementById("cIcon").value.trim()||"📁", description: document.getElementById("cDesc").value.trim()||"", order: DATA.categories.length+1 });
  saveOverrides(); refreshCatSelects(); renderCatsAdmin();
  document.getElementById("cName").value=""; document.getElementById("cIcon").value=""; document.getElementById("cDesc").value="";
  alert("القسم اتضاف ✅ — روح تبويب البنود والأسعار وضيف خدماته.");
}
function delCategory(id){
  const n = DATA.items.filter(i=>i.category===id).length;
  if(n>0 && !confirm(`القسم ده فيه ${n} خدمات — حذف القسم هيمسح خدماته كمان. متأكد؟`)) return;
  if(n===0 && !confirm("متأكد تحذف القسم ده؟")) return;
  DATA.categories = DATA.categories.filter(c=>c.id!==id);
  DATA.items = DATA.items.filter(i=>i.category!==id);
  saveOverrides(); refreshCatSelects(); renderCatsAdmin(); renderItems();
}
function renderItems(){
  const cat = document.getElementById("fCat").value;
  const q = (document.getElementById("fQ").value||"").trim();
  const list = DATA.items.filter(i=>i.category===cat && (!q || i.name.includes(q)));
  document.getElementById("itemsList").innerHTML = list.map(it=>{
    const p = it.levels.medium;
    return `<div class="card" style="margin-top:10px">
      <b>${it.name}</b> <span class="muted">— ${it.unit} • آخر تحديث ${it.updated_at}</span>
      <div class="row" style="margin-top:8px">
        <div><label>متوسط: من (ج.م)</label><input type="number" id="min-${it.id}" value="${p.total_min}"></div>
        <div><label>متوسط: إلى (ج.م)</label><input type="number" id="max-${it.id}" value="${p.total_max}"></div>
      </div>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn small" onclick="saveItem('${it.id}')">حفظ السعر</button>
        <button class="btn small ghost" onclick="delItem('${it.id}')">حذف البند</button>
        <a class="btn small ghost" href="item.html?id=${it.id}" target="_blank">عرض كعميل</a>
      </div>
      <p class="muted">الاقتصادي/اللوكس/السوبر لوكس بيتعدلوا من "تعديل بالجملة" أو من تصدير الـ JSON — والتعديل هنا على المتوسط بيحدّث الخامة (60%) والمصنعية (40%) تلقائياً.</p>
    </div>`;
  }).join("") || "<p class='muted'>مفيش بنود مطابقة.</p>";
}
function saveItem(id){
  const it = DATA.items.find(i=>i.id===id); if(!it) return;
  const mn = Number(document.getElementById("min-"+id).value)||0;
  const mx = Number(document.getElementById("max-"+id).value)||0;
  const p = it.levels.medium;
  p.total_min=mn; p.total_max=mx;
  p.material_min=Math.round(mn*0.6); p.material_max=Math.round(mx*0.6);
  p.labor_min=mn-p.material_min; p.labor_max=mx-p.material_max;
  it.updated_at = new Date().toISOString().slice(0,10);
  saveOverrides(); alert("اتحفظ ✅ — السعر الجديد ظاهر على الموقع في جهازك دلوقتي.");
  renderItems();
}
function delItem(id){
  if(!confirm("متأكد تحذف البند ده؟")) return;
  DATA.items = DATA.items.filter(i=>i.id!==id); saveOverrides(); renderItems();
}
function addItem(){
  const cat = document.getElementById("fCat").value;
  const name = document.getElementById("nName").value.trim();
  const mn = Number(document.getElementById("nMin").value)||0;
  const mx = Number(document.getElementById("nMax").value)||0;
  if(!name || !mn){ alert("اكتب اسم البند وسعر (من) على الأقل."); return; }
  const id = "item-" + Date.now().toString().slice(-6);
  const mk = (m)=>{ const tmn=Math.round(mn*m), tmx=Math.round(mx*m);
    return { material_min:Math.round(tmn*0.6), material_max:Math.round(tmx*0.6), labor_min:Math.round(tmn*0.4), labor_max:Math.round(tmx*0.4), total_min:tmn, total_max:tmx }; };
  DATA.items.push({ id, category: cat, name, description: document.getElementById("nDesc").value.trim()||name, unit: document.getElementById("nUnit").value, image:"images/placeholder.svg",
    levels:{ economy:mk(1), medium:mk(1.45), lux:mk(2.1), super_lux:mk(2.9) },
    notes:"السعر تقريبي وشامل الخامات والمصنعية.", updated_at:new Date().toISOString().slice(0,10) });
  saveOverrides(); alert("البند اتضاف ✅"); renderItems();
}
function bulkUpdate(){
  const cat = document.getElementById("bCat").value;
  const pct = Number(document.getElementById("bPct").value)||0;
  const lv = document.getElementById("bLevel").value;
  const f = 1 + pct/100;
  let n=0;
  DATA.items.filter(i=>i.category===cat).forEach(it=>{
    Object.keys(it.levels).forEach(k=>{
      if(lv!=="all" && k!==lv) return;
      const p=it.levels[k];
      ["material_min","material_max","labor_min","labor_max","total_min","total_max"].forEach(key=>{ p[key]=Math.round(p[key]*f); });
      it.updated_at=new Date().toISOString().slice(0,10); n++;
    });
  });
  saveOverrides();
  document.getElementById("bulkMsg").textContent = `تم ✅ — اتعدّل ${n} سعر في قسم ${DATA.categories.find(c=>c.id===cat).name} بنسبة ${pct}%`;
}
function saveSettings(){
  const wa = document.getElementById("sWa").value.trim();
  const npw = document.getElementById("sPw").value.trim();
  if(wa) window.EBNELY_CONFIG.whatsapp = wa;
  if(document.getElementById("sName").value.trim()) window.EBNELY_CONFIG.appNameAr = document.getElementById("sName").value.trim();
  if(npw){ localStorage.setItem("ebnely_admin_password", npw); window.EBNELY_CONFIG.adminPassword = npw; }
  saveOverrides();
  document.getElementById("setMsg").textContent = "اتحفظت الإعدادات ✅" + (npw ? " — الباسورد الجديد شغال من دلوقتي، احفظه كويس." : "");
}
function exportJSON(){
  saveOverrides();
  const blob = new Blob([JSON.stringify({ app:"Ebnely", app_ar: window.EBNELY_CONFIG.appNameAr, currency:"ج.م", updated_at:new Date().toISOString().slice(0,10), categories:DATA.categories, items:DATA.items }, null, 2)], {type:"application/json"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "ebnely-prices.json"; a.click();
}
document.addEventListener("DOMContentLoaded", ()=>{
  if(sessionStorage.getItem("ebnely_admin")==="1") showPanel();
  const pw = document.getElementById("pw");
  if(pw) pw.addEventListener("keydown", e=>{ if(e.key==="Enter") doLogin(); });
});
