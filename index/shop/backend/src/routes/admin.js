const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { v4: uuid } = require('uuid');
const db = require('../db/database');
const { adminOnly } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => cb(null, uuid() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ===== USERS =====
router.get('/users', adminOnly, (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  let query = 'SELECT id, name, email, role, balance, is_locked, created_at FROM users WHERE 1=1';
  const params = [];
  if (search) { query += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  const total = db.prepare(`SELECT COUNT(*) as c FROM (${query})`).get(...params).c;
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
  res.json({ users: db.prepare(query).all(...params), total });
});

router.put('/users/:id', adminOnly, (req, res) => {
  const { is_locked, balance, name } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Không tìm thấy user' });

  if (is_locked !== undefined) db.prepare('UPDATE users SET is_locked = ? WHERE id = ?').run(is_locked ? 1 : 0, req.params.id);
  if (balance !== undefined) {
    const diff = parseFloat(balance) - user.balance;
    db.prepare('UPDATE users SET balance = ? WHERE id = ?').run(parseFloat(balance), req.params.id);
    if (diff !== 0) {
      db.prepare(`INSERT INTO transactions (user_id, type, amount, status, note) VALUES (?, 'refund', ?, 'success', ?)`)
        .run(req.params.id, Math.abs(diff), `Admin điều chỉnh số dư (${diff > 0 ? '+' : ''}${diff})`);
    }
  }
  if (name) db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, req.params.id);
  res.json({ success: true });
});

router.get('/users/:id/orders', adminOnly, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(orders);
});

router.get('/users/:id/transactions', adminOnly, (req, res) => {
  const txs = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(txs);
});

// ===== CATEGORIES =====
router.get('/categories', (req, res) => {
  res.json(db.prepare('SELECT c.*, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1 GROUP BY c.id').all());
});

router.post('/categories', adminOnly, (req, res) => {
  const { name, icon } = req.body;
  if (!name) return res.status(400).json({ error: 'Thiếu tên danh mục' });
  const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, '-');
  try {
    const r = db.prepare('INSERT INTO categories (name, slug, icon) VALUES (?, ?, ?)').run(name, slug, icon || null);
    res.json({ id: r.lastInsertRowid });
  } catch { res.status(400).json({ error: 'Danh mục đã tồn tại' }); }
});

router.put('/categories/:id', adminOnly, (req, res) => {
  const { name, icon } = req.body;
  db.prepare('UPDATE categories SET name=?, icon=? WHERE id=?').run(name, icon, req.params.id);
  res.json({ success: true });
});

router.delete('/categories/:id', adminOnly, (req, res) => {
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ===== SETTINGS =====
router.get('/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  res.json(rows.reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {}));
});

router.put('/settings', adminOnly, upload.fields([{ name: 'logo' }, { name: 'banner' }, { name: 'bank_qr' }]), (req, res) => {
  const updates = { ...req.body };
  if (req.files?.logo?.[0]) updates.shop_logo = req.files.logo[0].filename;
  if (req.files?.banner?.[0]) updates.shop_banner = req.files.banner[0].filename;
  if (req.files?.bank_qr?.[0]) updates.bank_qr = req.files.bank_qr[0].filename;

  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const updateAll = db.transaction(() => {
    for (const [key, value] of Object.entries(updates)) upsert.run(key, value);
  });
  updateAll();
  res.json({ success: true });
});

// ===== DASHBOARD STATS =====
router.get('/stats', adminOnly, (req, res) => {
  const stats = {
    total_users: db.prepare('SELECT COUNT(*) as c FROM users WHERE role = "user"').get().c,
    total_orders: db.prepare('SELECT COUNT(*) as c FROM orders').get().c,
    total_revenue: db.prepare('SELECT COALESCE(SUM(total),0) as s FROM orders WHERE status = "completed"').get().s,
    pending_orders: db.prepare('SELECT COUNT(*) as c FROM orders WHERE status = "pending"').get().c,
    total_products: db.prepare('SELECT COUNT(*) as c FROM products WHERE is_active = 1').get().c,
    pending_topups: db.prepare('SELECT COUNT(*) as c FROM transactions WHERE status = "pending" AND type LIKE "topup%"').get().c,
    recent_orders: db.prepare('SELECT o.*, u.name as user_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 5').all(),
  };
  res.json(stats);
});

module.exports = router;
