const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { v4: uuid } = require('uuid');
const db = require('../db/database');
const { auth, adminOnly } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => cb(null, uuid() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

function slugify(text) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, '-').trim() + '-' + Date.now();
}

// GET all products (public)
router.get('/', (req, res) => {
  const { category, search, tag, featured, page = 1, limit = 12 } = req.query;
  let query = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = 1';
  const params = [];

  if (category) { query += ' AND c.slug = ?'; params.push(category); }
  if (search) { query += ' AND (p.name LIKE ? OR p.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (featured) { query += ' AND p.is_featured = 1'; }
  if (tag) { query += ' AND p.tags LIKE ?'; params.push(`%"${tag}"%`); }

  const total = db.prepare(`SELECT COUNT(*) as count FROM (${query})`).get(...params).count;
  query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  const products = db.prepare(query).all(...params).map(p => ({
    ...p, tags: JSON.parse(p.tags || '[]')
  }));

  res.json({ products, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
});

// GET single product
router.get('/:slug', (req, res) => {
  const product = db.prepare(`
    SELECT p.*, c.name as category_name,
      (SELECT AVG(rating) FROM reviews WHERE product_id = p.id) as avg_rating,
      (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) as review_count
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.slug = ? AND p.is_active = 1
  `).get(req.params.slug);

  if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });

  const reviews = db.prepare(`
    SELECT r.*, u.name as user_name, u.avatar FROM reviews r
    JOIN users u ON r.user_id = u.id WHERE r.product_id = ? ORDER BY r.created_at DESC
  `).all(product.id);

  res.json({ ...product, tags: JSON.parse(product.tags || '[]'), reviews });
});

// Admin: Create product
router.post('/', adminOnly, upload.fields([{ name: 'image' }, { name: 'file' }]), (req, res) => {
  const { name, description, price, stock, category_id, tags, is_featured, product_type } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });

  const type = product_type === 'direct' ? 'direct' : 'tool';
  const image = req.files?.image?.[0]?.filename || null;
  // Dịch vụ trực tiếp không cho phép upload file download
  const file_path = type === 'direct' ? null : (req.files?.file?.[0]?.filename || null);
  const slug = slugify(name);

  const result = db.prepare(`
    INSERT INTO products (name, slug, description, price, stock, category_id, image, file_path, tags, is_featured, product_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, slug, description, parseFloat(price), parseInt(stock) || 0, category_id || null,
    image, file_path, JSON.stringify(JSON.parse(tags || '[]')), is_featured === 'true' ? 1 : 0, type);

  res.json({ id: result.lastInsertRowid, slug });
});

// Admin: Update product
router.put('/:id', adminOnly, upload.fields([{ name: 'image' }, { name: 'file' }]), (req, res) => {
  const { name, description, price, stock, category_id, tags, is_featured, is_active, product_type } = req.body;
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });

  const type = product_type === 'direct' ? 'direct' : (product_type === 'tool' ? 'tool' : product.product_type);
  const image = req.files?.image?.[0]?.filename || product.image;
  // Dịch vụ trực tiếp không cho phép có file download
  const file_path = type === 'direct' ? null : (req.files?.file?.[0]?.filename || product.file_path);

  db.prepare(`
    UPDATE products SET name=?, description=?, price=?, stock=?, category_id=?, image=?, file_path=?,
    tags=?, is_featured=?, is_active=?, product_type=? WHERE id=?
  `).run(name || product.name, description ?? product.description, parseFloat(price) || product.price,
    parseInt(stock) ?? product.stock, category_id ?? product.category_id, image, file_path,
    JSON.stringify(JSON.parse(tags || product.tags || '[]')),
    is_featured !== undefined ? (is_featured === 'true' ? 1 : 0) : product.is_featured,
    is_active !== undefined ? (is_active === 'true' ? 1 : 0) : product.is_active,
    type,
    req.params.id);

  res.json({ success: true });
});

// Admin: Delete product
router.delete('/:id', adminOnly, (req, res) => {
  db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Review
router.post('/:id/reviews', auth, (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating 1-5' });

  // Check đã mua chưa
  const bought = db.prepare(`
    SELECT oi.id FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'completed'
  `).get(req.user.id, req.params.id);
  if (!bought) return res.status(400).json({ error: 'Bạn cần mua sản phẩm trước khi đánh giá' });

  try {
    db.prepare('INSERT OR REPLACE INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)')
      .run(req.params.id, req.user.id, rating, comment);
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: 'Lỗi khi lưu đánh giá' });
  }
});

module.exports = router;
