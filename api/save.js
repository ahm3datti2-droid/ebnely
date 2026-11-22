// Ebnely — النشر للكل: حفظ تعديلات الأدمن على GitHub مباشرة.
// POST /api/save { password, payload: { categories, items, settings } }
// يتحقق من الباسورد مقابل EBNELY_ADMIN_PASSWORD (متغير بيئة في Vercel)،
// وبعدين يحدّث data/prices.json في ريبو ahm3datti2-droid/ebnely عبر GitHub API
// باستخدام GITHUB_TOKEN (توكن بصلاحية contents:write على الريبو بس).
// بعد الـ commit، Vercel بيعيد النشر تلقائياً والأسعار الجديدة تظهر للكل.
const OWNER = process.env.GITHUB_OWNER || "ahm3datti2-droid";
const REPO = process.env.GITHUB_REPO || "ebnely";
const BRANCH = "main";
const PATH = "data/prices.json";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const pw = (body && body.password) || "";
  const payload = (body && body.payload) || {};
  if (!process.env.EBNELY_ADMIN_PASSWORD || pw !== process.env.EBNELY_ADMIN_PASSWORD) {
    res.status(401).json({ ok: false, error: "wrong_password" });
    return;
  }
  if (!process.env.GITHUB_TOKEN) {
    res.status(500).json({ ok: false, error: "no_token" });
    return;
  }
  if (!Array.isArray(payload.items) || !Array.isArray(payload.categories)) {
    res.status(400).json({ ok: false, error: "bad_payload" });
    return;
  }
  const headers = {
    "Authorization": "Bearer " + process.env.GITHUB_TOKEN,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "ebnely-admin-publish"
  };
  try {
    // هات نسخة الشا الحالية للملف عشان التحديث
    const getRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}?ref=${BRANCH}`, { headers });
    if (!getRes.ok) {
      res.status(502).json({ ok: false, error: "github_read_failed", status: getRes.status });
      return;
    }
    const current = await getRes.json();
    const doc = {
      app: "Ebnely",
      app_ar: (payload.settings && payload.settings.appNameAr) || "ابنيلي",
      currency: "ج.م",
      updated_at: new Date().toISOString().slice(0, 10),
      categories: payload.categories,
      items: payload.items
    };
    const content = Buffer.from(JSON.stringify(doc, null, 2), "utf-8").toString("base64");
    const putRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: "Admin publish: update prices (" + doc.updated_at + ")",
        content,
        sha: current.sha,
        branch: BRANCH
      })
    });
    if (!putRes.ok) {
      const txt = await putRes.text();
      res.status(502).json({ ok: false, error: "github_write_failed", status: putRes.status, detail: txt.slice(0, 300) });
      return;
    }
    const done = await putRes.json();
    res.status(200).json({ ok: true, commit: done.commit && done.commit.sha });
  } catch (e) {
    res.status(500).json({ ok: false, error: "server_error", detail: String(e && e.message || e).slice(0, 200) });
  }
}
