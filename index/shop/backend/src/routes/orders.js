const router = require('express').Router();
const db = require('../db/database');
const { auth, adminOnly } = require('../middleware/auth');

// Tạo đơn hàng
router.post('/', auth, (req, res) => {
  const { items, voucher_code, note } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'Giỏ hàng trống' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  // Validate items & tính giá
  let total = 0;
  const validatedItems = [];
  let hasDirectService = false;
  for (const item of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(item.product_id);
    if (!product) return res.status(400).json({ error: `Sản phẩm không tồn tại` });
    if (product.stock < item.quantity) return res.status(400).json({ error: `${product.name} không đủ hàng` });

    if (product.product_type === 'direct') {
      hasDirectService = true;
      if (!item.server_ip || !item.server_port || !item.mc_name) {
        return res.status(400).json({ error: `Vui lòng nhập đầy đủ IP server, Port, Tên MC cho "${product.name}"` });
      }
    }

    total += product.price * item.quantity;
    validatedItems.push({
      ...product,
      quantity: item.quantity,
      server_ip: item.server_ip || null,
      server_port: item.server_port || null,
      mc_name: item.mc_name || null,
    });
  }

  // Voucher
  let discount = 0;
  let voucher = null;
  if (voucher_code) {
    voucher = db.prepare(`
      SELECT * FROM vouchers WHERE code = ? AND is_active = 1
      AND (expires_at IS NULL OR expires_at > datetime('now'))
      AND (max_uses IS NULL OR used_count < max_uses)
    `).get(voucher_code);
    if (!voucher) return res.status(400).json({ error: 'Voucher không hợp lệ hoặc đã hết hạn' });
    if (total < voucher.min_order) return res.status(400).json({ error: `Đơn tối thiểu ${voucher.min_order.toLocaleString()}đ` });

    // Check user đã dùng voucher này chưa
    const alreadyUsed = db.prepare('SELECT id FROM voucher_uses WHERE voucher_id = ? AND user_id = ?').get(voucher.id, user.id);
    if (alreadyUsed) return res.status(400).json({ error: 'Bạn đã sử dụng voucher này rồi' });

    discount = voucher.discount_type === 'percent'
      ? total * voucher.discount_value / 100
      : voucher.discount_value;
    discount = Math.min(discount, total);
  }

  const finalTotal = total - discount;
  if (user.balance < finalTotal) return res.status(400).json({ error: 'Số dư không đủ' });

  // Transaction
  const placeOrder = db.transaction(() => {
    // Trừ tiền
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(finalTotal, user.id);

    // Đơn chỉ toàn "Tools" (tải file, không cần setup thủ công) -> tự động hoàn thành
    // Đơn có "Dịch vụ trực tiếp" -> cần admin duyệt tay (vì cần setup IP/Port/MC)
    const initialStatus = hasDirectService ? 'pending' : 'completed';

    // Tạo order
    const order = db.prepare(`
      INSERT INTO orders (user_id, total, discount, voucher_code, note, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(user.id, finalTotal, discount, voucher_code || null, note || null, initialStatus);

    // Order items & giảm stock
    for (const item of validatedItems) {
      db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, price, quantity, product_type, server_ip, server_port, mc_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(order.lastInsertRowid, item.id, item.name, item.price, item.quantity, item.product_type, item.server_ip, item.server_port, item.mc_name);
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.id);
    }

    // Transaction history
    db.prepare(`INSERT INTO transactions (user_id, type, amount, status, note) VALUES (?, 'purchase', ?, 'success', ?)`)
      .run(user.id, finalTotal, `Đơn hàng #${order.lastInsertRowid}`);

    // Voucher usage
    if (voucher) {
      db.prepare('UPDATE vouchers SET used_count = used_count + 1 WHERE id = ?').run(voucher.id);
      db.prepare('INSERT INTO voucher_uses (voucher_id, user_id, order_id) VALUES (?, ?, ?)').run(voucher.id, user.id, order.lastInsertRowid);
    }

    return order.lastInsertRowid;
  });

  const orderId = placeOrder();
  res.json({ success: true, order_id: orderId });
});

// Lịch sử đơn hàng của user
router.get('/my', auth, (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, GROUP_CONCAT(oi.product_name) as products
    FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.user_id = ? GROUP BY o.id ORDER BY o.created_at DESC
  `).all(req.user.id);
  res.json(orders);
});

// Chi tiết đơn hàng
router.get('/:id', auth, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!order && req.user.role !== 'admin') return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });

  const orderData = order || db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  const items = db.prepare('SELECT oi.*, p.image, p.slug FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?').all(req.params.id);
  res.json({ ...orderData, items });
});

// Admin: Danh sách tất cả đơn
router.get('/', adminOnly, (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  let query = 'SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id';
  const params = [];
  if (status) { query += ' WHERE o.status = ?'; params.push(status); }
  query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
  res.json(db.prepare(query).all(...params));
});

// Admin: Cập nhật trạng thái đơn
router.put('/:id/status', adminOnly, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'refunded'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Trạng thái không hợp lệ' });

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });

  const update = db.transaction(() => {
    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);

    // Hoàn tiền nếu refunded
    if (status === 'refunded' && order.status !== 'refunded') {
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(order.total, order.user_id);
      db.prepare(`INSERT INTO transactions (user_id, type, amount, status, note) VALUES (?, 'refund', ?, 'success', ?)`)
        .run(order.user_id, order.total, `Hoàn tiền đơn hàng #${order.id}`);
    }
  });

  update();
  res.json({ success: true });
});

module.exports = router;
