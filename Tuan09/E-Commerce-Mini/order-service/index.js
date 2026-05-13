// ORDER SERVICE — Port 8084 — Own DB: orders.db
// Flow: lấy cart → gọi Product Service lấy giá → tạo order
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const { randomUUID } = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const CART_SERVICE = 'http://localhost:8083';
const PRODUCT_SERVICE = 'http://localhost:8082';

// Own DB — không share với service nào khác
const db = new Database('./orders.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    totalAmount REAL NOT NULL,
    createdAt TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId TEXT NOT NULL,
    productId TEXT NOT NULL,
    productName TEXT,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL
  );
`);

// POST /orders — Checkout flow
app.post('/orders', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId là bắt buộc' });

  try {
    // Step 1: Lấy cart từ Cart Service
    const cartRes = await fetch(`${CART_SERVICE}/cart/${userId}`);
    const cartData = await cartRes.json();
    const cartItems = cartData.items || [];
    if (!cartItems.length) return res.status(400).json({ error: 'Giỏ hàng trống' });

    // Step 2: Gọi Product Service lấy giá từng sản phẩm
    const enriched = [];
    for (const item of cartItems) {
      const prodRes = await fetch(`${PRODUCT_SERVICE}/products/${item.productId}`);
      if (!prodRes.ok) return res.status(400).json({ error: `Sản phẩm ${item.productId} không tồn tại` });
      const product = await prodRes.json();
      enriched.push({ productId: item.productId, productName: product.name, price: product.price, quantity: item.quantity });
    }

    // Step 3: Tạo order
    const orderId = randomUUID();
    const totalAmount = enriched.reduce((sum, i) => sum + i.price * i.quantity, 0);
    db.prepare('INSERT INTO orders (id, userId, status, totalAmount) VALUES (?, ?, ?, ?)').run(orderId, userId, 'PENDING', totalAmount);
    const itemStmt = db.prepare('INSERT INTO order_items (orderId, productId, productName, price, quantity) VALUES (?, ?, ?, ?, ?)');
    enriched.forEach(i => itemStmt.run(orderId, i.productId, i.productName, i.price, i.quantity));

    // Step 4: Xóa cart sau khi đặt hàng
    await fetch(`${CART_SERVICE}/cart/${userId}`, { method: 'DELETE' });

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const items = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(orderId);
    res.json({ success: true, order: { ...order, items } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /orders — get all orders for a user
app.get('/orders', (req, res) => {
  const { userId } = req.query;
  const orders = userId
    ? db.prepare('SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC').all(userId)
    : db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all();
  const result = orders.map(o => ({
    ...o,
    items: db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(o.id)
  }));
  res.json(result);
});

// PATCH /orders/:id/status — update status (called by Payment Service)
app.patch('/orders/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

app.listen(8084, () => console.log('✅ Order Service :8084 (DB: orders.db) — gọi Cart + Product Service'));
