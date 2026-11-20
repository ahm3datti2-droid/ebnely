// Ebnely — الرئيسية
let DATA = null, currentLevel = "medium";
async function initHome() {
  DATA = await loadData();
  document.getElementById("updatedAt").textContent = "آخر تحديث للأسعار: " + DATA.updated_at + " — أسعار تقريبية استرشادية";
  renderCats(DATA.categories, "");
  const q = document.getElementById("q");
  if (q) q.addEventListener("input", () => renderCats(DATA.categories, q.value.trim()));
  document.querySelectorAll(".levels button").forEach(b => {
    b.addEventListener("click", () => {
      document.querySelectorAll(".levels button").forEach(x => x.classList.remove("active"));
      b.classList.add("active"); currentLevel = b.dataset.level;
    });
  });
  const wa = document.getElementById("waFloat");
  if (wa) wa.href = waLink();
}
function renderCats(cats, q) {
  const el = document.getElementById("cats");
  const list = cats.filter(c => !q || c.name.includes(q) || c.description.includes(q));
  el.innerHTML = list.map(c => {
    const n = DATA.items.filter(i => i.category === c.id).length;
    const thumb = c.image ? `<img class="cat-img" src="${c.image}" alt="${c.name}">` : `<div class="ico">${c.icon||"📁"}</div>`;
    return `<a class="cat-card" href="category.html?cat=${c.id}">
      ${thumb}<h3>${c.name}</h3><p>${c.description}</p>
      <div class="count">${n} بنود — اضغط لعرض الأسعار</div></a>`;
  }).join("") || `<div class="card">مفيش نتيجة مطابقة لـ "${q}"</div>`;
}
document.addEventListener("DOMContentLoaded", initHome);
