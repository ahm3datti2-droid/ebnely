// Ebnely — الحاسبة الكاملة (المرحلة 3)
// الكميات تقديرية من المساحة/الأوض/الحمامات — العميل يقدر يعدّل أي كمية بنفسه.
// الأسعار من data/prices.json (نفس أسعار الموقع) — التكلفة تقريبية استرشادية.
let DATA = null, level = localStorage.getItem("ebnely_level") || "medium";
let selected = {}; // id -> qty

// كمية تقديرية لكل بند: A=مساحة، R=أوض، B=حمامات
const QTY = {
  "item-01": (A,R,B)=>A*2.8, "item-02": (A,R,B)=>A*0.4, "item-03": (A,R,B)=>A,
  "item-04": (A,R,B)=>B, "item-05": (A,R,B)=>1, "item-06": (A,R,B)=>B+1,
  "item-07": (A,R,B)=>R*6+B*4+8, "item-08": (A,R,B)=>1, "item-09": (A,R,B)=>R*4+6,
  "item-10": (A,R,B)=>A*2.8, "item-11": (A,R,B)=>A*2.8, "item-12": (A,R,B)=>R*8,
  "item-13": (A,R,B)=>A, "item-14": (A,R,B)=>A, "item-15": (A,R,B)=>B*18+12,
  "item-16": (A,R,B)=>A*0.2, "item-17": (A,R,B)=>4, "item-18": (A,R,B)=>12,
  "item-19": (A,R,B)=>A*0.6, "item-20": (A,R,B)=>A*0.3, "item-21": (A,R,B)=>A*0.7,
  "item-22": (A,R,B)=>R+1, "item-23": (A,R,B)=>1, "item-24": (A,R,B)=>R*2,
  "item-25": (A,R,B)=>R*1.8, "item-26": (A,R,B)=>B+1, "item-27": (A,R,B)=>R*1.8,
  "item-28": (A,R,B)=>B*12, "item-29": (A,R,B)=>A, "item-30": (A,R,B)=>A,
  "item-31": (A,R,B)=>R, "item-32": (A,R,B)=>R, "item-33": (A,R,B)=>R*4,
  "item-34": (A,R,B)=>4, "item-35": (A,R,B)=>4, "item-36": (A,R,B)=>4,
  "item-37": (A,R,B)=>B, "item-38": (A,R,B)=>B, "item-39": (A,R,B)=>B,
  "item-40": (A,R,B)=>A*0.5, "item-41": (A,R,B)=>A*0.3, "item-42": (A,R,B)=>A*0.2,
  "item-43": (A,R,B)=>8, "item-44": (A,R,B)=>A*0.5, "item-45": (A,R,B)=>2
};
// البنود الافتراضية في حساب شقة سكنية (البدائل زي البورسلين بدل السيراميك مش متضمنة افتراضياً — ضيفها من "إضافة بند")
const DEFAULT_INCLUDED = ["item-01","item-03","item-04","item-05","item-06","item-07","item-08","item-09","item-10","item-13","item-15","item-17","item-19","item-21","item-22","item-23","item-25","item-26","item-28","item-31","item-32","item-33","item-34","item-45"];
// ملحوظة: "تشطيب حمام كامل" و"رخامة مطبخ" مش متضمنين افتراضياً عشان بيتداخلوا مع بنود السباكة/السيراميك/الجرانيت اللي في الحسبة — ضيفهم من "إضافة بند" لو عايزهم كمقطوعية بديلة.

function inputs(){
  return {
    area: Math.max(1, Number(document.getElementById("cArea").value)||100),
    rooms: Math.max(0, Number(document.getElementById("cRooms").value)||3),
    baths: Math.max(1, Number(document.getElementById("cBaths").value)||2)
  };
}
function calc(){
  const {area, rooms, baths} = inputs();
  // أول حساب: كمّيات افتراضية للي لسه متحددتش
  Object.keys(selected).forEach(id=>{
    if(selected[id]==null && QTY[id]) selected[id] = Math.round(QTY[id](area,rooms,baths)*10)/10;
  });
  render();
}
function lineTotal(it, qty){
  const p = it.levels[level];
  return { min: Math.round(qty*p.total_min), max: Math.round(qty*p.total_max), unitMin: p.total_min, unitMax: p.total_max };
}
function render(){
  const {area, rooms, baths} = inputs();
  const rows = Object.keys(selected).map(id=>{
    const it = DATA.items.find(x=>x.id===id); if(!it) return null;
    const qty = selected[id];
    const t = lineTotal(it, qty);
    return {it, qty, ...t};
  }).filter(Boolean);
  let tMin=0, tMax=0; rows.forEach(r=>{ tMin+=r.min; tMax+=r.max; });
  document.getElementById("rows").innerHTML = rows.map(r=>`
    <tr>
      <td><input type="checkbox" checked onchange="toggleItem('${r.it.id}', this.checked)" title="شيل/ضيف البند"></td>
      <td>${r.it.name}<br><span class="muted">${r.it.unit} • ${fmt(r.unitMin)}–${fmt(r.unitMax)} ج.م</span></td>
      <td><input type="number" min="0" step="0.5" value="${r.qty}" style="width:80px;padding:6px" onchange="setQty('${r.it.id}', this.value)"></td>
      <td><b>${fmt(r.min)} – ${fmt(r.max)}</b> ج.م</td>
    </tr>`).join("") || `<tr><td colspan="4">مفيش بنود — ضيف بند من تحت.</td></tr>`;
  document.getElementById("totalMin").textContent = fmt(tMin);
  document.getElementById("totalMax").textContent = fmt(tMax);
  document.getElementById("totalMid").textContent = fmt(Math.round((tMin+tMax)/2));
  document.getElementById("resCount").textContent = rows.length + " بند";
  document.getElementById("resMeta").textContent = `شقة ${area} م² • ${rooms} أوض • ${baths} حمامات • مستوى ${levelLabel(level)}`;
  // قائمة إضافة بند: اللي مش في الحسبة دلوقتي
  const addSel = document.getElementById("addItem");
  const cur = addSel.value;
  addSel.innerHTML = `<option value="">— اختار بند تضيفه —</option>` + DATA.items
    .filter(i=>!(i.id in selected))
    .map(i=>`<option value="${i.id}">${i.name} (${i.unit})</option>`).join("");
  if(cur && !(cur in selected)) addSel.value = cur;
  buildQuote(rows, tMin, tMax);
}
function toggleItem(id, on){
  if(on){ const {area, rooms, baths} = inputs(); selected[id] = Math.round((QTY[id]?QTY[id](area,rooms,baths):1)*10)/10; }
  else delete selected[id];
  render();
}
function setQty(id, v){
  const q = Math.max(0, Number(v)||0); selected[id] = q; render();
}
function addSelectedItem(){
  const id = document.getElementById("addItem").value; if(!id) return;
  const {area, rooms, baths} = inputs();
  selected[id] = Math.round((QTY[id]?QTY[id](area,rooms,baths):1)*10)/10;
  render();
  document.getElementById("rows").scrollIntoView({behavior:"smooth", block:"start"});
}
function setLevel(l){
  level = l; localStorage.setItem("ebnely_level", l);
  document.querySelectorAll("#levels button").forEach(b=>b.classList.toggle("active", b.dataset.level===l));
  render();
}
function quoteText(rows, tMin, tMax){
  const {area, rooms, baths} = inputs();
  const name = document.getElementById("cName").value.trim();
  const phone = document.getElementById("cPhone").value.trim();
  let s = `سلام، أنا ${name||"عميل"} ${phone?("— تليفوني "+phone):""}\nعايز عرض سعر تشطيب شقة من Ebnely (ابنيلي):\nشقة ${area} م² • ${rooms} أوض • ${baths} حمامات • مستوى ${levelLabel(level)}\n\nالبنود:\n`;
  rows.forEach(r=>{ s += `• ${r.it.name}: ${r.qty} ${r.it.unit} × ${fmt(r.unitMin)}–${fmt(r.unitMax)} = ${fmt(r.min)}–${fmt(r.max)} ج.م\n`; });
  s += `\nالإجمالي التقريبي: ${fmt(tMin)} – ${fmt(tMax)} ج.م\n(أسعار تقريبية استرشادية — السعر النهائي بعد المعاينة)`;
  return s;
}
function buildQuote(rows, tMin, tMax){
  const {area, rooms, baths} = inputs();
  document.getElementById("qMeta").textContent = `شقة ${area} م² • ${rooms} أوض • ${baths} حمامات • مستوى ${levelLabel(level)} • ${new Date().toISOString().slice(0,10)}`;
  document.getElementById("qRows").innerHTML = rows.map(r=>`<tr><td>${r.it.name}</td><td>${r.qty} ${r.it.unit}</td><td>${fmt(r.min)} – ${fmt(r.max)} ج.م</td></tr>`).join("");
  document.getElementById("qTotal").textContent = fmt(tMin) + " – " + fmt(tMax) + " ج.م";
  document.getElementById("waBtn").href = waLink(quoteText(rows, tMin, tMax));
}
function sendWhatsApp(){
  const rows = currentRows();
  let tMin=0, tMax=0; rows.forEach(r=>{ tMin+=r.min; tMax+=r.max; });
  const req = `<b>طلب عرض سعر — ${new Date().toLocaleString("ar-EG")}</b><br>${document.getElementById("qMeta").textContent}<br>الإجمالي: ${fmt(tMin)} – ${fmt(tMax)} ج.م<br><span class="muted">${rows.length} بند</span>`;
  const reqs = JSON.parse(localStorage.getItem("ebnely_requests")||"[]");
  reqs.unshift(req); localStorage.setItem("ebnely_requests", JSON.stringify(reqs.slice(0,50)));
  window.open(document.getElementById("waBtn").href, "_blank");
}
function currentRows(){
  return Object.keys(selected).map(id=>{
    const it = DATA.items.find(x=>x.id===id); if(!it) return null;
    const t = lineTotal(it, selected[id]); return {it, qty: selected[id], ...t};
  }).filter(Boolean);
}
function printQuote(){ window.print(); }
async function init(){
  DATA = await loadData();
  document.querySelectorAll("#levels button").forEach(b=>{
    b.classList.toggle("active", b.dataset.level===level);
    b.onclick = ()=>setLevel(b.dataset.level);
  });
  const {area, rooms, baths} = inputs();
  DEFAULT_INCLUDED.forEach(id=>{ if(QTY[id]) selected[id] = Math.round(QTY[id](area,rooms,baths)*10)/10; });
  ["cArea","cRooms","cBaths"].forEach(id=>document.getElementById(id).addEventListener("input", ()=>{
    // إعادة حساب الكميات الافتراضية لما المساحة/الأوض تتغير
    const inp = inputs();
    Object.keys(selected).forEach(k=>{ if(QTY[k]) selected[k] = Math.round(QTY[k](inp.area,inp.rooms,inp.baths)*10)/10; });
    render();
  }));
  document.getElementById("waFloat").href = waLink("سلام، عايز أحسب تكلفة تشطيب شقتي من Ebnely");
  render();
}
document.addEventListener("DOMContentLoaded", init);
