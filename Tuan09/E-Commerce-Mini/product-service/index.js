// PRODUCT SERVICE — Port 8082 — Own DB: products.db
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const { randomUUID } = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// Own DB — không share với service nào khác
const db = new Database('./products.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 100,
    image TEXT DEFAULT '📦',
    description TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  )
`);

// Seed demo products
const count = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
if (count === 0) {
  const seed = [
    { name: 'iPhone 16 Pro', price: 32000000, stock: 50, image: '📱', description: 'Chip A18 Pro, màn hình OLED 6.3"' },
    { name: 'Samsung Galaxy S25', price: 22000000, stock: 30, image: '📱', description: 'Snapdragon 8 Elite, AI camera' },
    { name: 'MacBook Air M3', price: 35000000, stock: 20, image: '💻', description: '13.6" Liquid Retina, 18h battery' },
    { name: 'AirPods Pro 3', price: 6500000, stock: 100, image: '🎧', description: 'ANC thế hệ 3, Spatial Audio' },
    { name: 'iPad Pro M4', price: 28000000, stock: 40, image: '🖥️', description: 'Màn hình Tandem OLED, chip M4' },
    { name: 'Apple Watch S10', price: 12000000, stock: 60, image: '⌚', description: 'Ultra-thin design, 18h battery' },
  ];
  const stmt = db.prepare('INSERT INTO products (id, name, price, stock, image, description) VALUES (?, ?, ?, ?, ?, ?)');
  seed.forEach(p => stmt.run(randomUUID(), p.name, p.price, p.stock, p.image, p.description));
  console.log('Seeded 6 products');
}

app.get('/products', (req, res) => {
  res.json(db.prepare('SELECT * FROM products').all());
});

app.get('/products/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  res.json(p);
});

app.post('/products', (req, res) => {
  const { name, price, stock, image, description } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'name và price là bắt buộc' });
  const id = randomUUID();
  db.prepare('INSERT INTO products (id, name, price, stock, image, description) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, name, parseFloat(price), parseInt(stock || 100), image || '📦', description || '');
  res.json({ success: true, product: db.prepare('SELECT * FROM products WHERE id = ?').get(id) });
});

app.put('/products/:id', (req, res) => {
  const { name, price, stock, image, description } = req.body;
  const p = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  db.prepare('UPDATE products SET name=?, price=?, stock=?, image=?, description=? WHERE id=?')
    .run(name || p.name, price ? parseFloat(price) : p.price, stock !== undefined ? parseInt(stock) : p.stock,
         image || p.image, description || p.description, req.params.id);
  res.json({ success: true, product: db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) });
});

app.listen(8082, () => console.log('✅ Product Service :8082 (DB: products.db)'));
