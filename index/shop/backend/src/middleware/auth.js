const jwt = require('jsonwebtoken');
const db = require('../db/database');

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Chưa đăng nhập' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = db.prepare('SELECT id, name, email, role, balance, is_locked, avatar FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.status(401).json({ error: 'Tài khoản không tồn tại' });
    if (user.is_locked) return res.status(403).json({ error: 'Tài khoản đã bị khóa' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Token không hợp lệ' });
  }
}

function adminOnly(req, res, next) {
  auth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Không có quyền truy cập' });
    next();
  });
}

module.exports = { auth, adminOnly };
