const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { auth } = require('../middleware/auth');

// Register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Mật khẩu ít nhất 6 ký tự' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(400).json({ error: 'Email đã được sử dụng' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name, email, hash);
  const user = db.prepare('SELECT id, name, email, role, balance FROM users WHERE id = ?').get(result.lastInsertRowid);

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
  res.json({ token, user });
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(400).json({ error: 'Email hoặc mật khẩu không đúng' });
  if (user.is_locked) return res.status(403).json({ error: 'Tài khoản đã bị khóa' });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Email hoặc mật khẩu không đúng' });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
  const { password: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// Me
router.get('/me', auth, (req, res) => {
  res.json(req.user);
});

// Update profile
router.put('/me', auth, (req, res) => {
  const { name, password, newPassword } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  if (newPassword) {
    if (!password) return res.status(400).json({ error: 'Nhập mật khẩu hiện tại' });
    if (!bcrypt.compareSync(password, user.password))
      return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
    const hash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, req.user.id);
  }

  if (name) db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, req.user.id);

  const updated = db.prepare('SELECT id, name, email, role, balance, avatar FROM users WHERE id = ?').get(req.user.id);
  res.json(updated);
});

module.exports = router;
