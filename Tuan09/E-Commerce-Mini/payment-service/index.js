// PAYMENT SERVICE — Port 8085 — Own DB: payments.db
// Sau thanh toán: gọi Order Service để cập nhật trạng thái
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const { randomUUID } = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const ORDER_SERVICE = 'http://localhost:8084';

// Own DB — không share với service nào khác
const db = new Database('./payments.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    orderId TEXT NOT NULL,
    amount REAL NOT NULL,
    method TEXT DEFAULT 'CREDIT_CARD',
    status TEXT NOT NULL,
    transactionId TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  )
`);

// POST /payments
app.post('/payments', async (req, res) => {
  const { orderId, amount, method = 'CREDIT_CARD' } = req.body;
  if (!orderId || !amount) return res.status(400).json({ error: 'orderId và amount là bắt buộc' });

  // Giả lập thanh toán: 85% thành công
  const isSuccess = Math.random() < 0.85;
  const status = isSuccess ? 'SUCCESS' : 'FAILED';
  const transactionId = isSuccess ? 'TXN' + Date.now() : null;

  // Lưu payment record
  const paymentId = randomUUID();
  db.prepare('INSERT INTO payments (id, orderId, amount, method, status, transactionId) VALUES (?, ?, ?, ?, ?, ?)').run(paymentId, orderId, amount, method, status, transactionId);

  // Gọi Order Service để cập nhật trạng thái đơn hàng
  try {
    await fetch(`${ORDER_SERVICE}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: isSuccess ? 'PAID' : 'PAYMENT_FAILED' })
    });
  } catch(e) {
    console.error('Không thể cập nhật Order status:', e.message);
  }

  if (isSuccess) {
    res.json({ success: true, transactionId, paymentId, message: 'Thanh toán thành công' });
  } else {
    res.status(400).json({ success: false, error: 'Thanh toán thất bại — thẻ không đủ số dư' });
  }
});

// GET /payments — lịch sử thanh toán
app.get('/payments', (req, res) => {
  res.json(db.prepare('SELECT * FROM payments ORDER BY createdAt DESC').all());
});

app.listen(8085, () => console.log('✅ Payment Service :8085 (DB: payments.db) — 85% success rate'));
