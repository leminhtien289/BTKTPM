// CART SERVICE — Port 8083 — Own DB: cart.db
// Quan trọng: CHỈ lưu productId, KHÔNG lưu chi tiết product (đúng yêu cầu đề bài)
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

const app = express();
app.use(cors());
app.use(express.json());

// Own DB — không share với service nào khác
const db = new Database('./cart.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    productId TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    addedAt TEXT DEFAULT (datetime('now')),
    UNIQUE(userId, productId)
  )
`);

// POST /cart/add
app.post('/cart/add', (req, res) => {
  const { userId, productId, quantity = 1 } = req.body;
  if (!userId || !productId) return res.status(400).json({ error: 'userId và productId là bắt buộc' });
  try {
    const existing = db.prepare('SELECT * FROM cart_items WHERE userId = ? AND productId = ?').get(userId, productId);
    if (existing) {
      db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE userId = ? AND productId = ?').run(quantity, userId, productId);
    } else {
      db.prepare('INSERT INTO cart_items (userId, productId, quantity) VALUES (?, ?, ?)').run(userId, productId, quantity);
    }
    res.json({ success: true, cart: db.prepare('SELECT * FROM cart_items WHERE userId = ?').all(userId) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /cart/:userId
app.get('/cart/:userId', (req, res) => {
  const items = db.prepare('SELECT * FROM cart_items WHERE userId = ?').all(req.params.userId);
  res.json({ userId: req.params.userId, items });
});

// DELETE /cart/item
app.delete('/cart/item', (req, res) => {
  const { userId, productId } = req.body;
  db.prepare('DELETE FROM cart_items WHERE userId = ? AND productId = ?').run(userId, productId);
  res.json({ success: true, cart: db.prepare('SELECT * FROM cart_items WHERE userId = ?').all(userId) });
});

// DELETE /cart/:userId — clear entire cart
app.delete('/cart/:userId', (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE userId = ?').run(req.params.userId);
  res.json({ success: true, items: [] });
});

app.listen(8083, () => console.log('✅ Cart Service :8083 (DB: cart.db) — chỉ lưu productId'));
