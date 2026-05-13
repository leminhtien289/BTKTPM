const express = require('express');
const cors = require('cors');
const Redis = require('ioredis');

const app = express();
app.use(cors());
app.use(express.json());

const redis = new Redis({ host: process.env.REDIS_HOST || 'localhost', port: 6379 });
redis.on('error', err => console.error('[Redis]', err.message));

const CART_TTL = 86400; // 24h in seconds

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'PU2-Cart', storage: 'Redis Data Grid' }));

// GET /cart/:userId — get cart from Data Grid
app.get('/cart/:userId', async (req, res) => {
  try {
    const data = await redis.get(`cart:${req.params.userId}`);
    res.json({ userId: req.params.userId, items: data ? JSON.parse(data) : [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /cart/add — add or increment item in cart (stored in Data Grid)
app.post('/cart/add', async (req, res) => {
  const { userId, productId, name, price, quantity = 1 } = req.body;
  if (!userId || !productId) return res.status(400).json({ error: 'userId and productId required' });

  try {
    const raw = await redis.get(`cart:${userId}`);
    const cart = raw ? JSON.parse(raw) : [];

    const existing = cart.find(i => i.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ productId, name, price, quantity });
    }

    await redis.setex(`cart:${userId}`, CART_TTL, JSON.stringify(cart));
    res.json({ success: true, items: cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /cart/:userId — clear entire cart
app.delete('/cart/:userId', async (req, res) => {
  try {
    await redis.del(`cart:${req.params.userId}`);
    res.json({ success: true, items: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /cart/:userId/item/:productId — remove single item
app.delete('/cart/:userId/item/:productId', async (req, res) => {
  const { userId, productId } = req.params;
  try {
    const raw = await redis.get(`cart:${userId}`);
    if (!raw) return res.json({ success: true, items: [] });

    const cart = JSON.parse(raw).filter(i => i.productId !== productId);
    await redis.setex(`cart:${userId}`, CART_TTL, JSON.stringify(cart));
    res.json({ success: true, items: cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(8082, () => console.log('PU2-Cart :8082 — cart session stored in Redis Data Grid'));
