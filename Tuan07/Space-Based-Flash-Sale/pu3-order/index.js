const express = require('express');
const cors = require('cors');
const Redis = require('ioredis');
const { randomUUID } = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const redis = new Redis({ host: process.env.REDIS_HOST || 'localhost', port: 6379 });
redis.on('error', err => console.error('[Redis]', err.message));

const INVENTORY_URL = process.env.INVENTORY_URL || 'http://localhost:8084';

// Call PU4 to reduce stock with retry on lock contention (429)
async function reduceStock(productId, quantity, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(`${INVENTORY_URL}/stock/reduce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity }),
    });
    const data = await res.json();
    if (res.ok) return data;
    if (data.retry && attempt < retries) {
      await new Promise(r => setTimeout(r, 100 * attempt)); // backoff
      continue;
    }
    throw new Error(data.error || 'Stock reduce failed');
  }
}

// Best-effort rollback — restore stock if partial failure during checkout
async function restoreStock(productId, quantity) {
  await fetch(`${INVENTORY_URL}/stock/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, quantity }),
  }).catch(() => {});
}

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'PU3-Order', db: 'none — Data Grid only' }));

// POST /checkout — reads cart from Data Grid, reduces stock via PU4, saves order in Data Grid
app.post('/checkout', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    // 1. Get cart from Data Grid (no DB read)
    const raw = await redis.get(`cart:${userId}`);
    if (!raw) return res.status(400).json({ error: 'Cart is empty' });
    const items = JSON.parse(raw);
    if (!items.length) return res.status(400).json({ error: 'Cart is empty' });

    // 2. Reduce stock for each item; rollback on failure
    const reduced = [];
    try {
      for (const item of items) {
        await reduceStock(item.productId, item.quantity);
        reduced.push(item);
      }
    } catch (err) {
      for (const item of reduced) {
        await restoreStock(item.productId, item.quantity);
      }
      return res.status(400).json({ error: err.message });
    }

    // 3. Persist order in Data Grid (no DB write)
    const orderId = randomUUID();
    const order = {
      id: orderId,
      userId,
      items,
      total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    await redis.setex(`order:${orderId}`, 86400 * 7, JSON.stringify(order));
    await redis.lpush('order_list', orderId);

    // 4. Clear cart
    await redis.del(`cart:${userId}`);

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /orders/:orderId
app.get('/orders/:orderId', async (req, res) => {
  try {
    const data = await redis.get(`order:${req.params.orderId}`);
    if (!data) return res.status(404).json({ error: 'Order not found' });
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(8083, () => console.log('PU3-Order :8083 — checkout with no DB, all in-memory'));
