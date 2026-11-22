// Ebnely — لوحة الأدمن
let DATA = null;
let ADMIN_PW = ""; // باسورد الجلسة — بيستخدم في النشر للكل (مش بيتخزن في localStorage)
function pwOK(){ return (localStorage.getItem("ebnely_admin_password") || window.EBNELY_CONFIG.adminPassword); }
function doLogin(){
  const v = document.getElementById("pw").value.trim();
  if(v === pwOK()){ ADMIN_PW = v; sessionStorage.setItem("ebnely_admin","1"); showPanel(); }
  else document.getElementById("loginErr").textContent = "الباسورد غلط — جرّب تاني.";
}
// تأكيد حفظ ظاهر على الصفحة (مش alert بس) — بتاريخ وساعة الحفظ
function showSaved(msg){
  const el = document.getElementById("saveStatus");
  const t = new Date().toLocaleString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  if(el) el.textContent = "✅ " + msg + " — الساعة " + t;
}
async function publishAll(){
  const btn = document.getElementById("publishBtn");
  if(!ADMIN_PW) ADMIN_PW = prompt("اكتب باسورد الأدمن عشان النشر للكل:") || "";
  if(!ADMIN_PW) return;
  if(btn) btn.disabled = true;
  const el = document.getElementById("saveStatus");
  if(el) el.textContent = "⏳ جاري النشر للكل... استنى ثواني.";
  try{
    saveOverrides();
    const r = await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: ADMIN_PW, payload: { categories: DATA.categories, items: DATA.items,
        settings: { whatsapp: window.EBNELY_CONFIG.whatsapp, appNameAr: window.EBNELY_CONFIG.appNameAr } } }) });
    const j = await r.json().catch(()=>({}));
    if(r.ok && j.ok){
      localStorage.setItem("ebnely_last_publish", new Date().toISOString());
      if(el) el.textContent = "✅ اتنشر للكل — الأسعار الجديدة هتظهر لكل الزوار خلال دقيقة تقريباً (Vercel بيعيد النشر).";
    } else if(j.error === "wrong_password"){
      if(el) el.textContent = "❌ الباسورد مش متطابق مع النشر — جرّب تدخل باسورد الأدمن الصح، أو ابعتلي أظبطه.";
    } else if(j.error === "no_token"){
      if(el) el.textContent = "❌ النشر لسه مظبطش من الإعدادات (مفيش توكن) — ابعتلي وأنا أكمّله.";
    } else {
      if(el) el.textContent = "❌ النشر فشل (" + (j.error || r.status) + ") — التعديلات محفوظة في جهازك، جرّب تاني بعد شوية أو ابعتلي.";
    }
  } catch(e){
    if(el) el.textContent = "❌ مفيش اتصال — التعديلات محفوظة في جهازك، جرّب النشر تاني لما النت يرجع.";
  }
  if(btn) btn.disabled = false;
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
  const lp = localStorage.getItem("ebnely_last_publish");
  if(lp) document.getElementById("saveStatus").textContent = "☁️ آخر نشر للكل كان: " + new Date(lp).toLocaleString("ar-EG");
  const reqs = JSON.parse(localStorage.getItem("ebnely_requests")||"[]");
  document.getElementById("reqList").innerHTML = reqs.length ? reqs.map(r=>`<div class="card" style="margin-top:8px">${r}</div>`).join("") : "<p class='muted'>لا توجد طلبات بعد.</p>";
}
function saveOverrides(){
  try{
    localStorage.setItem("ebnely_overrides", JSON.stringify({ items: DATA.items, categories: DATA.categories, settings: { whatsapp: window.EBNELY_CONFIG.whatsapp, appNameAr: window.EBNELY_CONFIG.appNameAr }, saved_at: new Date().toISOString().slice(0,10) }));
    return true;
  } catch(e){
    // التخزين المحلي اتملى (غالباً صور أقسام كتير) — بلّغ الأدمن بدل ما التعديل يضيع في صمت
    const el = document.getElementById("saveStatus");
    if(el) el.textContent = "⚠️ التخزين المحلي في جهازك اتملى — التعديل الأخير متحفظش. شيل صورة قسم قديمة أو قلّل الصور، وبعدين جرّب تاني.";
    return false;
  }
}
function refreshCatSelects(){
  const opts = DATA.categories.map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
  document.getElementById("fCat").innerHTML = opts;
  document.getElementById("bCat").innerHTML = opts;
}
function renderCatsAdmin(){
  document.getElementById("catsList").innerHTML = DATA.categories.map((c, idx)=>{
    const n = DATA.items.filter(i=>i.category===c.id).length;
    const preview = c.image ? `<img src="${c.image}" alt="">` : `<div style="font-size:36px">${c.icon||"📁"}</div>`;
    const esc = s => (s||"").replace(/"/g, "&quot;");
    return `<div class="cat-edit">
      <div style="display:flex;gap:10px;align-items:center">${preview}
        <div><b>${c.name}</b> <span class="muted">— ${n} خدمات • ترتيبه ${idx+1} من ${DATA.categories.length}</span><br><span class="muted">${c.description||""}</span></div>
      </div>
      <div class="row" style="margin-top:10px">
        <div><label>اسم القسم</label><input id="name-${c.id}" value="${esc(c.name)}"></div>
        <div><label>الأيقونة (إيموجي)</label><input id="icon-${c.id}" value="${esc(c.icon)}" placeholder="🏗️"></div>
      </div>
      <label>وصف القسم</label><input id="desc-${c.id}" value="${esc(c.description)}">
      <div class="row" style="margin-top:10px">
        <div><label>اسم الصورة</label><input id="imgname-${c.id}" value="${esc(c.image_name)}" placeholder="مثال: سباكة.jpg"></div>
        <div><label>ترتيب القسم في الرئيسية</label><div style="display:flex;gap:8px"><button class="btn small ghost" onclick="moveCat('${c.id}',-1)">↑ فوق</button><button class="btn small ghost" onclick="moveCat('${c.id}',1)">↓ تحت</button></div></div>
      </div>
      <label>صورة القسم — من موبايلك (مش لينك)</label>
      <input type="file" accept="image/*" onchange="catImagePicked(event,'${c.id}')">
      ${c.image ? `<p class="muted">الصورة الحالية: ${c.image_name||"صورة مرفوعة"} — دوس "اختار ملف" فوق عشان تغيّرها بصورة جديدة من موبايلك.</p>` : `<p class="muted">لسه مفيش صورة — اختار صورة من موبايلك وهتظهر في الرئيسية بدل الأيقونة. الصورة بتتصغّر تلقائياً (أقصى 600px).</p>`}
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn small" onclick="saveCat('${c.id}')">💾 حفظ كل تعديلات القسم</button>
        <button class="btn small dark" onclick="editItemsOfCat('${c.id}')">بنود القسم (${n}) — تعديل خدماته</button>
        <button class="btn small ghost" onclick="removeCatImage('${c.id}')">إزالة الصورة (ارجع للأيقونة)</button>
        <button class="btn small ghost" onclick="delCategory('${c.id}')">حذف القسم</button>
      </div>
    </div>`;
  }).join("");
}
function saveCat(id){
  const c = DATA.categories.find(x=>x.id===id); if(!c) return;
  const nm = document.getElementById("name-"+id).value.trim();
  if(!nm){ alert("اسم القسم مينفعش يبقى فاضي."); return; }
  c.name = nm;
  c.description = document.getElementById("desc-"+id).value.trim();
  c.icon = document.getElementById("icon-"+id).value.trim() || "📁";
  const imn = document.getElementById("imgname-"+id).value.trim();
  if(imn) c.image_name = imn; else delete c.image_name;
  if(saveOverrides()) showSaved("اتحفظ كل تعديل قسم " + c.name + " (الاسم والوصف والأيقونة والصورة) — دوس «انشر للكل» عشان يظهر للزوار");
  refreshCatSelects(); renderCatsAdmin();
}
function moveCat(id, dir){
  const i = DATA.categories.findIndex(x=>x.id===id); if(i<0) return;
  const j = i + dir; if(j<0 || j>=DATA.categories.length) return;
  const tmp = DATA.categories[i]; DATA.categories[i] = DATA.categories[j]; DATA.categories[j] = tmp;
  DATA.categories.forEach((c, k)=>c.order = k+1);
  if(saveOverrides()) showSaved("اتغيّر ترتيب الأقسام — دوس «انشر للكل» عشان يظهر للزوار");
  refreshCatSelects(); renderCatsAdmin();
}
function editItemsOfCat(id){
  showTab("items");
  document.getElementById("fCat").value = id;
  document.getElementById("fQ").value = "";
  renderItems();
  window.scrollTo({top: 0, behavior: "smooth"});
}
function removeCatImage(id){
  const c = DATA.categories.find(x=>x.id===id); if(!c) return;
  delete c.image; delete c.image_name;
  if(saveOverrides()) showSaved("اتشالت صورة قسم " + c.name + " — دوس «انشر للكل» عشان يظهر للزوار");
  renderCatsAdmin();
}
function catImagePicked(ev, id){
  const f = ev.target.files && ev.target.files[0]; if(!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const max = 600, scale = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement("canvas");
      cv.width = Math.round(img.width*scale); cv.height = Math.round(img.height*scale);
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      const c = DATA.categories.find(x=>x.id===id); if(!c) return;
      c.image = cv.toDataURL("image/jpeg", 0.82);
      c.image_name = f.name || "صورة القسم";
      if(saveOverrides()) showSaved("الصورة اترفعت واتحفظت — اسمها: " + c.image_name + " — دوس «انشر للكل» عشان تظهر للزوار");
      renderCatsAdmin();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(f);
}
function addCategory(){
  const name = document.getElementById("cName").value.trim();
  if(!name){ alert("اكتب اسم القسم الأول."); return; }
  const id = "cat-" + Date.now().toString().slice(-6);
  DATA.categories.push({ id, name, icon: document.getElementById("cIcon").value.trim()||"📁", description: document.getElementById("cDesc").value.trim()||"", order: DATA.categories.length+1 });
  if(saveOverrides()) showSaved("القسم اتضاف — روح تبويب البنود والأسعار وضيف خدماته، وبعدين دوس «انشر للكل»");
  refreshCatSelects(); renderCatsAdmin();
  document.getElementById("cName").value=""; document.getElementById("cIcon").value=""; document.getElementById("cDesc").value="";
}
function delCategory(id){
  const n = DATA.items.filter(i=>i.category===id).length;
  if(n>0 && !confirm(`القسم ده فيه ${n} خدمات — حذف القسم هيمسح خدماته كمان. متأكد؟`)) return;
  if(n===0 && !confirm("متأكد تحذف القسم ده؟")) return;
  DATA.categories = DATA.categories.filter(c=>c.id!==id);
  DATA.items = DATA.items.filter(i=>i.category!==id);
  if(saveOverrides()) showSaved("القسم اتحذف — دوس «انشر للكل» عشان يختفي عند الزوار");
  refreshCatSelects(); renderCatsAdmin(); renderItems();
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
  if(saveOverrides()) showSaved("اتحفظ سعر " + it.name + " (متوسط " + mn + " – " + mx + " ج.م) — دوس «انشر للكل» عشان يظهر للزوار");
  renderItems();
}
function delItem(id){
  if(!confirm("متأكد تحذف البند ده؟")) return;
  const nm = (DATA.items.find(i=>i.id===id)||{}).name || "";
  DATA.items = DATA.items.filter(i=>i.id!==id);
  if(saveOverrides()) showSaved("البند " + nm + " اتحذف — دوس «انشر للكل» عشان يختفي عند الزوار");
  renderItems();
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
  if(saveOverrides()) showSaved("البند " + name + " اتضاف — دوس «انشر للكل» عشان يظهر للزوار");
  renderItems();
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
  if(saveOverrides()) showSaved(`اتعدّل ${n} سعر في قسم ${DATA.categories.find(c=>c.id===cat).name} بنسبة ${pct}% — دوس «انشر للكل» عشان يظهر للزوار`);
  document.getElementById("bulkMsg").textContent = `تم ✅ — اتعدّل ${n} سعر في قسم ${DATA.categories.find(c=>c.id===cat).name} بنسبة ${pct}%`;
}
function saveSettings(){
  const wa = document.getElementById("sWa").value.trim();
  const npw = document.getElementById("sPw").value.trim();
  if(wa) window.EBNELY_CONFIG.whatsapp = wa;
  if(document.getElementById("sName").value.trim()) window.EBNELY_CONFIG.appNameAr = document.getElementById("sName").value.trim();
  if(npw){ localStorage.setItem("ebnely_admin_password", npw); window.EBNELY_CONFIG.adminPassword = npw; ADMIN_PW = npw; }
  if(saveOverrides()) showSaved("اتحفظت الإعدادات — دوس «انشر للكل» عشان تظهر للزوار");
  document.getElementById("setMsg").textContent = "اتحفظت الإعدادات ✅" + (npw ? " — الباسورد الجديد شغال من دلوقتي، احفظه كويس. ملحوظة: لو غيّرت الباسورد، النشر للكل هيحتاج تحديثه في إعدادات Vercel — ابعتلي." : "");
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
