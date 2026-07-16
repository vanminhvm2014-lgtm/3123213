const router = require('express').Router();
const db = require('../db/database');
const { auth, adminOnly } = require('../middleware/auth');

// Kiểm tra voucher (user)
router.post('/check', auth, (req, res) => {
  const { code, total } = req.body;
  const voucher = db.prepare(`
    SELECT * FROM vouchers WHERE code = ? AND is_active = 1
    AND (expires_at IS NULL OR expires_at > datetime('now'))
    AND (max_uses IS NULL OR used_count < max_uses)
  `).get(code);

  if (!voucher) return res.status(400).json({ error: 'Voucher không hợp lệ hoặc đã hết hạn' });
  if (total && total < voucher.min_order) return res.status(400).json({ error: `Đơn tối thiểu ${voucher.min_order.toLocaleString()}đ` });

  const alreadyUsed = db.prepare('SELECT id FROM voucher_uses WHERE voucher_id = ? AND user_id = ?').get(voucher.id, req.user.id);
  if (alreadyUsed) return res.status(400).json({ error: 'Bạn đã sử dụng voucher này rồi' });

  const discount = voucher.discount_type === 'percent'
    ? (total || 0) * voucher.discount_value / 100
    : voucher.discount_value;

  res.json({ valid: true, voucher, discount });
});

// Admin: Tất cả vouchers
router.get('/', adminOnly, (req, res) => {
  res.json(db.prepare('SELECT * FROM vouchers ORDER BY created_at DESC').all());
});

// Admin: Tạo voucher
router.post('/', adminOnly, (req, res) => {
  const { code, discount_type, discount_value, min_order, max_uses, expires_at } = req.body;
  if (!code || !discount_value) return res.status(400).json({ error: 'Thiếu thông tin' });

  try {
    db.prepare(`
      INSERT INTO vouchers (code, discount_type, discount_value, min_order, max_uses, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(code.toUpperCase(), discount_type || 'percent', discount_value, min_order || 0, max_uses || null, expires_at || null);
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: 'Mã voucher đã tồn tại' });
  }
});

// Admin: Xóa voucher
router.delete('/:id', adminOnly, (req, res) => {
  db.prepare('UPDATE vouchers SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Admin: Sửa voucher
router.put('/:id', adminOnly, (req, res) => {
  const { discount_type, discount_value, min_order, max_uses, expires_at, is_active } = req.body;
  db.prepare(`
    UPDATE vouchers SET discount_type=?, discount_value=?, min_order=?, max_uses=?, expires_at=?, is_active=? WHERE id=?
  `).run(discount_type, discount_value, min_order, max_uses, expires_at, is_active ? 1 : 0, req.params.id);
  res.json({ success: true });
});

module.exports = router;
