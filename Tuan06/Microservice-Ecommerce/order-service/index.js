const express = require('express');
const Database = require('better-sqlite3');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(express.json());

const PRODUCT_SERVICE  = process.env.PRODUCT_SERVICE_URL  || 'http://localhost:8081';
const CUSTOMER_SERVICE = process.env.CUSTOMER_SERVICE_URL || 'http://localhost:8082';

const dbPath = process.env.DB_PATH || path.join('/data', 'orders.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id   INTEGER NOT NULL,
    customer_name TEXT    NOT NULL,
    product_id    INTEGER NOT NULL,
    product_name  TEXT    NOT NULL,
    quantity      INTEGER NOT NULL DEFAULT 1,
    unit_price    REAL    NOT NULL,
    total_price   REAL    NOT NULL,
    status        TEXT    NOT NULL DEFAULT 'pending',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

app.get('/orders', (req, res) => {
  res.json(db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all());
});

app.get('/orders/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Order not found' });
  res.json(row);
});

app.post('/orders', async (req, res) => {
  const { customer_id, product_id, quantity = 1 } = req.body;
  if (!customer_id || !product_id) {
    return res.status(400).json({ error: 'customer_id and product_id are required' });
  }
  if (quantity < 1) return res.status(400).json({ error: 'quantity must be >= 1' });

  try {
    const [custRes, prodRes] = await Promise.all([
      axios.get(`${CUSTOMER_SERVICE}/customers/${customer_id}`, { timeout: 3000 }),
      axios.get(`${PRODUCT_SERVICE}/products/${product_id}`,   { timeout: 3000 }),
    ]);

    const customer = custRes.data;
    const product  = prodRes.data;

    if (product.stock < quantity) {
      return res.status(422).json({ error: `Insufficient stock. Available: ${product.stock}` });
    }

    const unit_price  = product.price;
    const total_price = unit_price * quantity;

    const r = db.prepare(`
      INSERT INTO orders (customer_id, customer_name, product_id, product_name, quantity, unit_price, total_price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(customer_id, customer.name, product_id, product.name, quantity, unit_price, total_price);

    res.status(201).json(db.prepare('SELECT * FROM orders WHERE id = ?').get(r.lastInsertRowid));
  } catch (err) {
    if (err.response?.status === 404) return res.status(404).json({ error: err.response.data.error });
    res.status(500).json({ error: 'Failed to create order', details: err.message });
  }
});

app.patch('/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Order not found' });
  db.prepare('UPDATE orders SET status=? WHERE id=?').run(status, req.params.id);
  res.json(db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id));
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'order-service' }));

const PORT = process.env.PORT || 8083;
app.listen(PORT, () => console.log(`Order Service on port ${PORT}`));
