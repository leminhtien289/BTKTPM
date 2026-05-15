const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
app.use(express.json());

const db = new Database(process.env.DB_PATH || path.join('/data', 'shipments.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS shipments (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id      INTEGER NOT NULL,
    customer_name TEXT,
    address       TEXT,
    status        TEXT NOT NULL DEFAULT 'pending',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

app.get('/shipments', (req, res) =>
  res.json(db.prepare('SELECT * FROM shipments ORDER BY created_at DESC').all()));

app.get('/shipments/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM shipments WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Shipment not found' });
  res.json(row);
});

app.post('/shipments', (req, res) => {
  const { order_id, customer_name, address } = req.body;
  if (!order_id) return res.status(400).json({ error: 'order_id required' });
  const r = db.prepare('INSERT INTO shipments (order_id, customer_name, address, status) VALUES (?, ?, ?, ?)')
              .run(order_id, customer_name ?? null, address ?? null, 'pending');
  const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(r.lastInsertRowid);
  console.log(`[shipment] created #${shipment.id} for order=${order_id}`);
  res.status(201).json(shipment);
});

// PATCH /shipments/:id/status — update delivery status
app.patch('/shipments/:id/status', (req, res) => {
  const ALLOWED = ['pending', 'in_transit', 'delivered', 'returned'];
  const { status } = req.body;
  if (!ALLOWED.includes(status))
    return res.status(400).json({ error: `status must be one of: ${ALLOWED.join(', ')}` });

  const row = db.prepare('SELECT * FROM shipments WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Shipment not found' });

  db.prepare('UPDATE shipments SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .run(status, req.params.id);
  res.json(db.prepare('SELECT * FROM shipments WHERE id = ?').get(req.params.id));
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'shipping-service' }));

const PORT = process.env.PORT || 8086;
app.listen(PORT, () => console.log(`Shipping Service on port ${PORT}`));
