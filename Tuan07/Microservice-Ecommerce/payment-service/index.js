const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
app.use(express.json());

const db = new Database(process.env.DB_PATH || path.join('/data', 'payments.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id   INTEGER NOT NULL,
    amount     REAL    NOT NULL,
    method     TEXT    NOT NULL DEFAULT 'credit_card',
    status     TEXT    NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

app.get('/payments', (req, res) =>
  res.json(db.prepare('SELECT * FROM payments ORDER BY created_at DESC').all()));

app.get('/payments/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Payment not found' });
  res.json(row);
});

// POST /payments — simulate 80% success, 20% failure
app.post('/payments', (req, res) => {
  const { order_id, amount, method = 'credit_card' } = req.body;
  if (!order_id || amount == null)
    return res.status(400).json({ error: 'order_id and amount required' });

  const success = Math.random() < 0.8;
  const status  = success ? 'completed' : 'failed';

  const r = db.prepare('INSERT INTO payments (order_id, amount, method, status) VALUES (?, ?, ?, ?)')
              .run(order_id, amount, method, status);
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(r.lastInsertRowid);

  console.log(`[payment] order=${order_id} amount=${amount} → ${status}`);
  res.status(201).json({ ...payment, message: success ? 'Payment approved' : 'Payment declined' });
});

// POST /payments/:id/refund
app.post('/payments/:id/refund', (req, res) => {
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  if (payment.status !== 'completed')
    return res.status(422).json({ error: `Cannot refund payment with status: ${payment.status}` });

  db.prepare('UPDATE payments SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .run('refunded', req.params.id);
  res.json(db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id));
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'payment-service' }));

const PORT = process.env.PORT || 8084;
app.listen(PORT, () => console.log(`Payment Service on port ${PORT}`));
