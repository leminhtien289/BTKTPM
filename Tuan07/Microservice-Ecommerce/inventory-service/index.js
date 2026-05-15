const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
app.use(express.json());

const db = new Database(process.env.DB_PATH || path.join('/data', 'inventory.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS inventory (
    product_id   INTEGER PRIMARY KEY,
    product_name TEXT,
    quantity     INTEGER NOT NULL DEFAULT 0,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Seed matches product-service seed data (same product_ids)
if (db.prepare('SELECT COUNT(*) AS c FROM inventory').get().c === 0) {
  const ins = db.prepare('INSERT INTO inventory (product_id, product_name, quantity) VALUES (?, ?, ?)');
  ins.run(1, 'Laptop Pro',          50);
  ins.run(2, 'Wireless Mouse',      200);
  ins.run(3, 'Mechanical Keyboard', 100);
  ins.run(4, 'Monitor 27"',         30);
  console.log('Seeded inventory for 4 products');
}

app.get('/inventory', (req, res) =>
  res.json(db.prepare('SELECT * FROM inventory').all()));

app.get('/inventory/:productId', (req, res) => {
  const row = db.prepare('SELECT * FROM inventory WHERE product_id = ?').get(req.params.productId);
  if (!row) return res.status(404).json({ error: 'Product not in inventory' });
  res.json(row);
});

// Reduce stock — called when order is placed
app.put('/inventory/:productId/reduce', (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1)
    return res.status(400).json({ error: 'quantity must be >= 1' });

  const item = db.prepare('SELECT * FROM inventory WHERE product_id = ?').get(req.params.productId);
  if (!item) return res.status(404).json({ error: 'Product not in inventory' });
  if (item.quantity < quantity)
    return res.status(422).json({ error: `Insufficient stock. Available: ${item.quantity}` });

  db.prepare('UPDATE inventory SET quantity=quantity-?, updated_at=CURRENT_TIMESTAMP WHERE product_id=?')
    .run(quantity, req.params.productId);
  const updated = db.prepare('SELECT * FROM inventory WHERE product_id = ?').get(req.params.productId);
  console.log(`[inventory] product=${req.params.productId} reduced by ${quantity} → remaining: ${updated.quantity}`);
  res.json(updated);
});

// Restore stock — called when payment fails or order is cancelled
app.put('/inventory/:productId/restore', (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1)
    return res.status(400).json({ error: 'quantity must be >= 1' });

  const item = db.prepare('SELECT * FROM inventory WHERE product_id = ?').get(req.params.productId);
  if (!item) return res.status(404).json({ error: 'Product not in inventory' });

  db.prepare('UPDATE inventory SET quantity=quantity+?, updated_at=CURRENT_TIMESTAMP WHERE product_id=?')
    .run(quantity, req.params.productId);
  const updated = db.prepare('SELECT * FROM inventory WHERE product_id = ?').get(req.params.productId);
  console.log(`[inventory] product=${req.params.productId} restored by ${quantity} → remaining: ${updated.quantity}`);
  res.json(updated);
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'inventory-service' }));

const PORT = process.env.PORT || 8085;
app.listen(PORT, () => console.log(`Inventory Service on port ${PORT}`));
