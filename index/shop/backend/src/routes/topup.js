const router = require('express').Router();
const db = require('../db/database');
const { auth, adminOnly } = require('../middleware/auth');

// Lịch sử giao dịch của user
router.get('/history', auth, (req, res) => {
  const txs = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
  res.json(txs);
});

// Nạp tiền QR (tạo request, admin duyệt hoặc webhook)
router.post('/qr', auth, (req, res) => {
  const { amount } = req.body;
  if (!amount || amount < 10000) return res.status(400).json({ error: 'Số tiền tối thiểu 10.000đ' });

  const settings = db.prepare('SELECT key, value FROM settings WHERE key IN (?, ?, ?, ?)')
    .all('bank_name', 'bank_account', 'bank_owner', 'bank_qr')
    .reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});

  const ref_code = `NAP${req.user.id}${Date.now()}`;

  db.prepare(`INSERT INTO transactions (user_id, type, amount, status, ref_code, note) VALUES (?, 'topup_qr', ?, 'pending', ?, ?)`)
    .run(req.user.id, amount, ref_code, `Nạp QR - mã ${ref_code}`);

  res.json({ ref_code, ...settings, amount });
});

// Admin duyệt nạp tiền QR
router.post('/qr/approve', adminOnly, (req, res) => {
  const { transaction_id, status } = req.body; // status: success | failed
  const tx = db.prepare('SELECT * FROM transactions WHERE id = ? AND type = ?').get(transaction_id, 'topup_qr');
  if (!tx) return res.status(404).json({ error: 'Không tìm thấy giao dịch' });
  if (tx.status !== 'pending') return res.status(400).json({ error: 'Giao dịch đã được xử lý' });

  const approve = db.transaction(() => {
    db.prepare('UPDATE transactions SET status = ? WHERE id = ?').run(status, transaction_id);
    if (status === 'success') {
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(tx.amount, tx.user_id);
    }
  });
  approve();
  res.json({ success: true });
});

// Nạp thẻ cào
router.post('/card', auth, (req, res) => {
  const { telco, serial, pin, amount } = req.body;
  if (!telco || !serial || !pin || !amount) return res.status(400).json({ error: 'Thiếu thông tin thẻ' });

  // ⚠️ Auto-approve KHÔNG kiểm tra thẻ thật (chưa tích hợp API gạch thẻ) — chỉ tin tưởng thông tin người dùng nhập
  const autoApprove = db.prepare(`SELECT value FROM settings WHERE key = 'auto_approve_card'`).get()?.value === '1';
  const status = autoApprove ? 'approved' : 'pending';

  const result = db.prepare(`INSERT INTO card_topups (user_id, telco, serial, pin, amount, status) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user.id, telco, serial, pin, amount, status);

  // Thêm transaction
  db.prepare(`INSERT INTO transactions (user_id, type, amount, status, ref_code, note) VALUES (?, 'topup_card', ?, ?, ?, ?)`)
    .run(req.user.id, amount, autoApprove ? 'success' : 'pending', `CARD${result.lastInsertRowid}`, `Nạp thẻ ${telco.toUpperCase()}`);

  if (autoApprove) {
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, req.user.id);
    return res.json({ success: true, message: 'Nạp thẻ thành công! (Tự động duyệt)' });
  }

  res.json({ success: true, message: 'Yêu cầu nạp thẻ đã gửi, chờ admin duyệt' });
});

// Admin: danh sách thẻ cần duyệt
router.get('/card/pending', adminOnly, (req, res) => {
  const cards = db.prepare(`
    SELECT ct.*, u.name as user_name, u.email FROM card_topups ct
    JOIN users u ON ct.user_id = u.id WHERE ct.status = 'pending' ORDER BY ct.created_at DESC
  `).all();
  res.json(cards);
});

// Admin duyệt thẻ cào
router.post('/card/:id/approve', adminOnly, (req, res) => {
  const { status, actual_amount } = req.body;
  const card = db.prepare('SELECT * FROM card_topups WHERE id = ?').get(req.params.id);
  if (!card) return res.status(404).json({ error: 'Không tìm thấy' });

  const finalAmount = actual_amount || card.amount;
  const approve = db.transaction(() => {
    db.prepare('UPDATE card_topups SET status = ?, note = ? WHERE id = ?').run(status, req.body.note, req.params.id);
    const txRef = `CARD${card.id}`;
    db.prepare('UPDATE transactions SET status = ?, amount = ? WHERE ref_code = ?').run(status, finalAmount, txRef);
    if (status === 'approved') {
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(finalAmount, card.user_id);
    }
  });
  approve();
  res.json({ success: true });
});

// Admin: Tất cả transactions
router.get('/all', adminOnly, (req, res) => {
  const { type, status, page = 1 } = req.query;
  let query = 'SELECT t.*, u.name as user_name, u.email FROM transactions t JOIN users u ON t.user_id = u.id WHERE 1=1';
  const params = [];
  if (type) { query += ' AND t.type = ?'; params.push(type); }
  if (status) { query += ' AND t.status = ?'; params.push(status); }
  query += ' ORDER BY t.created_at DESC LIMIT 50 OFFSET ?';
  params.push((parseInt(page) - 1) * 50);
  res.json(db.prepare(query).all(...params));
});

module.exports = router;
