const express  = require('express');
const Database = require('better-sqlite3');
const axios    = require('axios');
const path     = require('path');
const { log }  = require('./logger');

const app = express();
app.use(express.json());

const PRODUCT_SERVICE   = process.env.PRODUCT_SERVICE_URL   || 'http://localhost:8081';
const CUSTOMER_SERVICE  = process.env.CUSTOMER_SERVICE_URL  || 'http://localhost:8082';
const PAYMENT_SERVICE   = process.env.PAYMENT_SERVICE_URL   || 'http://localhost:8084';
const INVENTORY_SERVICE = process.env.INVENTORY_SERVICE_URL || 'http://localhost:8085';
const SHIPPING_SERVICE  = process.env.SHIPPING_SERVICE_URL  || 'http://localhost:8086';

const db = new Database(process.env.DB_PATH || path.join('/data', 'orders.db'));
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
    payment_id    INTEGER,
    shipment_id   INTEGER,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

app.get('/orders', (req, res) => res.json(db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all()));

app.get('/orders/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Order not found' });
  res.json(row);
});

app.post('/orders', async (req, res) => {
  const { customer_id, product_id, quantity = 1 } = req.body;
  if (!customer_id || !product_id) return res.status(400).json({ error: 'customer_id and product_id required' });
  if (quantity < 1) return res.status(400).json({ error: 'quantity must be >= 1' });

  log('info', 'Order creation started', { customer_id, product_id, quantity });

  try {
    const [custRes, prodRes] = await Promise.all([
      axios.get(`${CUSTOMER_SERVICE}/customers/${customer_id}`, { timeout: 3000 }),
      axios.get(`${PRODUCT_SERVICE}/products/${product_id}`,   { timeout: 3000 }),
    ]);
    const customer = custRes.data;
    const product  = prodRes.data;

    await axios.put(`${INVENTORY_SERVICE}/inventory/${product_id}/reduce`, { quantity }, { timeout: 3000 });

    const total_price = product.price * quantity;
    const r = db.prepare(`
      INSERT INTO orders (customer_id, customer_name, product_id, product_name, quantity, unit_price, total_price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(customer_id, customer.name, product_id, product.name, quantity, product.price, total_price);
    const orderId = r.lastInsertRowid;

    let finalStatus = 'pending', paymentId = null, shipmentId = null;
    try {
      const payRes = await axios.post(`${PAYMENT_SERVICE}/payments`,
        { order_id: orderId, amount: total_price, method: 'credit_card' }, { timeout: 5000 });
      const payment = payRes.data;
      paymentId = payment.id;
      if (payment.status === 'completed') {
        finalStatus = 'confirmed';
        try {
          const shipRes = await axios.post(`${SHIPPING_SERVICE}/shipments`,
            { order_id: orderId, customer_name: customer.name, address: customer.address }, { timeout: 3000 });
          shipmentId = shipRes.data.id;
        } catch (e) { log('warn', 'Shipment creation failed', { orderId, error: e.message }); }
      } else {
        finalStatus = 'payment_failed';
        await axios.put(`${INVENTORY_SERVICE}/inventory/${product_id}/restore`, { quantity }).catch(() => {});
      }
    } catch (e) {
      finalStatus = 'payment_error';
      await axios.put(`${INVENTORY_SERVICE}/inventory/${product_id}/restore`, { quantity }).catch(() => {});
      log('error', 'Payment service error', { orderId, error: e.message });
    }

    db.prepare('UPDATE orders SET status=?, payment_id=?, shipment_id=? WHERE id=?')
      .run(finalStatus, paymentId, shipmentId, orderId);

    log('info', 'Order created', { orderId, status: finalStatus, total_price });
    res.status(201).json(db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId));
  } catch (err) {
    if (err.response?.status === 404) return res.status(404).json({ error: err.response.data.error });
    if (err.response?.status === 422) return res.status(422).json({ error: err.response.data.error });
    log('error', 'Order creation failed', { error: err.message });
    res.status(500).json({ error: 'Order creation failed', details: err.message });
  }
});

app.patch('/orders/:id/status', (req, res) => {
  const allowed = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'payment_failed'];
  const { status } = req.body;
  if (!allowed.includes(status)) return res.status(400).json({ error: `status must be: ${allowed.join(', ')}` });
  if (!db.prepare('SELECT id FROM orders WHERE id = ?').get(req.params.id))
    return res.status(404).json({ error: 'Order not found' });
  db.prepare('UPDATE orders SET status=? WHERE id=?').run(status, req.params.id);
  log('info', 'Order status updated', { orderId: req.params.id, status });
  res.json(db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id));
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'order-service' }));

const PORT = process.env.PORT || 8083;
app.listen(PORT, () => log('info', 'Order Service started', { port: PORT }));
