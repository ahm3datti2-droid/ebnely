-- Ebnely — مخطط قاعدة البيانات D1 (Cloudflare) — المرحلة 1
-- نفس شكل data/prices.json بالظبط، عشان النقل لـ D1 في المرحلة 5 يكون مباشر.

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '',
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  unit TEXT NOT NULL CHECK (unit IN ('م²','م.ط','نقطة','قطعة','مقطوعية')),
  image_url TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  updated_at TEXT DEFAULT (date('now'))
);

CREATE TABLE IF NOT EXISTS item_prices (
  item_id TEXT NOT NULL REFERENCES items(id),
  level TEXT NOT NULL CHECK (level IN ('economy','medium','lux','super_lux')),
  material_min INTEGER NOT NULL DEFAULT 0,
  material_max INTEGER NOT NULL DEFAULT 0,
  labor_min INTEGER NOT NULL DEFAULT 0,
  labor_max INTEGER NOT NULL DEFAULT 0,
  total_min INTEGER NOT NULL DEFAULT 0,
  total_max INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (item_id, level)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- مفاتيح الإعدادات: whatsapp, app_name_ar, admin_password_hash

CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  area REAL,
  rooms INTEGER,
  bathrooms INTEGER,
  level TEXT,
  total_estimate INTEGER,
  details_json TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_requests_created ON requests(created_at);

-- الأقسام الـ 15 (نفس data/prices.json):
INSERT OR IGNORE INTO categories (id, name, icon, description, sort_order) VALUES
('plaster','محارة','🏗️','تأسيس المحارة والبياض الداخلي والخارجي',1),
('plumbing','سباكة','🚿','تأسيس وتركيب السباكة للحمامات والمطابخ',2),
('electricity','كهرباء','💡','تأسيس وتركيب الكهرباء والإضاءة',3),
('painting','نقاشة ودهانات','🎨','معجون ودهانات وتشطيب الحوائط',4),
('ceramic','سيراميك وبورسلين','🧱','تركيب سيراميك وبورسلين أرضيات وحوائط',5),
('marble','رخام وجرانيت','🪨','تركيب رخام وجرانيت للأرضيات والمطابخ والدرج',6),
('gypsum','جبس بورد وأسقف','⬜','أسقف جبس بورد وديكورات وإضاءة مخفية',7),
('carpentry','نجارة وأبواب','🚪','أبواب خشب ونجارة داخلية',8),
('alumetal','ألوميتال وشبابيك','🪟','شبابيك وأبواب ألوميتال وواجهات',9),
('insulation','عزل (مائي/حراري)','🛡️','عزل مائي وحراري للحمامات والأسطح',10),
('ac','تكييف وتأسيس','❄️','تأسيس وتركيب التكييفات',11),
('kitchens','مطابخ','🍳','تشطيب وتركيب المطابخ',12),
('bathrooms','حمامات','🛁','تشطيب الحمامات كاملة',13),
('facades','واجهات','🏠','تشطيب واجهات العمارات والفيلات',14),
('demolition','هدم ونقل مخلفات','🔨','هدم وتكسير ونقل مخلفات',15);
