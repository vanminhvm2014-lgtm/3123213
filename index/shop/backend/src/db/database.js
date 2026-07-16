const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '../../data/shop.db');

// Tạo thư mục data nếu chưa có
const fs = require('fs');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDB() {
  db.exec(`
    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user', -- user | admin
      balance REAL DEFAULT 0,
      is_locked INTEGER DEFAULT 0,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Settings
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    -- Categories
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Products
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      price REAL NOT NULL DEFAULT 0,
      stock INTEGER DEFAULT 0,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      image TEXT,
      file_path TEXT,
      tags TEXT DEFAULT '[]',
      is_featured INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      product_type TEXT DEFAULT 'tool', -- tool | direct (dịch vụ trực tiếp cần nhập IP/Port/MC Name)
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Orders
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending', -- pending | confirmed | completed | cancelled | refunded
      voucher_code TEXT,
      discount REAL DEFAULT 0,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Order Items
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      product_type TEXT DEFAULT 'tool',
      server_ip TEXT,
      server_port TEXT,
      mc_name TEXT
    );

    -- Transactions (nạp tiền)
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL, -- topup_qr | topup_card | purchase | refund
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending', -- pending | success | failed
      note TEXT,
      ref_code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Vouchers
    CREATE TABLE IF NOT EXISTS vouchers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT DEFAULT 'percent', -- percent | fixed
      discount_value REAL NOT NULL,
      min_order REAL DEFAULT 0,
      max_uses INTEGER DEFAULT NULL,
      used_count INTEGER DEFAULT 0,
      expires_at DATETIME,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Voucher usage
    CREATE TABLE IF NOT EXISTS voucher_uses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucher_id INTEGER NOT NULL REFERENCES vouchers(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      order_id INTEGER REFERENCES orders(id),
      used_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Reviews
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(product_id, user_id)
    );

    -- Card topup requests
    CREATE TABLE IF NOT EXISTS card_topups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      telco TEXT NOT NULL,
      serial TEXT NOT NULL,
      pin TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending', -- pending | approved | rejected
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration an toàn cho DB cũ đã tồn tại (bỏ qua nếu cột đã có)
  const tryAlter = (sql) => { try { db.exec(sql) } catch (e) { /* cột đã tồn tại, bỏ qua */ } };
  tryAlter(`ALTER TABLE products ADD COLUMN product_type TEXT DEFAULT 'tool'`);
  tryAlter(`ALTER TABLE order_items ADD COLUMN product_type TEXT DEFAULT 'tool'`);
  tryAlter(`ALTER TABLE order_items ADD COLUMN server_ip TEXT`);
  tryAlter(`ALTER TABLE order_items ADD COLUMN server_port TEXT`);
  tryAlter(`ALTER TABLE order_items ADD COLUMN mc_name TEXT`);

  // Default settings
  const defaultSettings = {
    shop_name: 'GalaxyX Store',
    shop_logo: 'galaxyx-logo.png',
    shop_banner: 'galaxyx-banner.png',
    shop_email: '',
    bank_name: 'Vietcombank',
    bank_account: '0123456789',
    bank_owner: 'NGUYEN VAN A',
    bank_qr: '',
    primary_color: '#6366f1',
    dark_mode_default: '0',
    auto_approve_card: '0' // '1' = tự động duyệt thẻ cào (KHÔNG kiểm tra thẻ thật, rủi ro cao)
  };

  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of Object.entries(defaultSettings)) {
    insertSetting.run(key, value);
  }

  // Áp dụng logo/banner/tên mới cho DB đã tồn tại trước đó (nếu đang để trống/mặc định cũ)
  const forceUpdateIfEmpty = (key, value) => {
    const current = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    if (!current || !current.value || current.value === 'MyShop') {
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
    }
  };
  forceUpdateIfEmpty('shop_name', 'GalaxyX Store');
  forceUpdateIfEmpty('shop_logo', 'galaxyx-logo.png');
  forceUpdateIfEmpty('shop_banner', 'galaxyx-banner.png');

  // Admin mặc định
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@shop.com';
  const adminPass = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (!existing) {
    const hash = bcrypt.hashSync(adminPass, 10);
    db.prepare(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')`)
      .run('Admin', adminEmail, hash);
    console.log(`✅ Admin created: ${adminEmail} / ${adminPass}`);
  }

  console.log('✅ Database initialized');
}

initDB();

module.exports = db;
