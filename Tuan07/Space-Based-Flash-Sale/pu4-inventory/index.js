const express = require('express');
const cors = require('cors');
const Redis = require('ioredis');

const app = express();
app.use(cors());
app.use(express.json());

const redis = new Redis({ host: process.env.REDIS_HOST || 'localhost', port: 6379 });
redis.on('error', err => console.error('[Redis]', err.message));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'PU4-Inventory', locking: 'SETNX' }));

// GET /stock/:productId — read stock directly from Data Grid
app.get('/stock/:productId', async (req, res) => {
  try {
    const val = await redis.get(`stock:${req.params.productId}`);
    if (val === null) return res.status(404).json({ error: 'Product not found' });
    res.json({ productId: req.params.productId, stock: parseInt(val) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /stock — all stock levels
app.get('/stock', async (req, res) => {
  try {
    const keys = await redis.keys('stock:*');
    const result = {};
    for (const key of keys) {
      const id = key.split(':')[1];
      result[id] = parseInt(await redis.get(key));
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /stock/reduce — SETNX distributed lock prevents overselling under high concurrency
app.post('/stock/reduce', async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId required' });

  const lockKey = `lock:stock:${productId}`;

  // SETNX (SET if Not eXists): only one writer per product at a time, 5s TTL prevents deadlock
  const acquired = await redis.set(lockKey, '1', 'NX', 'EX', 5);
  if (!acquired) {
    return res.status(429).json({ error: 'Stock update in progress, retry shortly', retry: true });
  }

  try {
    const current = await redis.get(`stock:${productId}`);
    if (current === null) return res.status(404).json({ error: 'Product not found' });

    const stock = parseInt(current);
    if (stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock', available: stock });
    }

    const remaining = await redis.decrby(`stock:${productId}`, quantity);
    res.json({ success: true, productId, reduced: quantity, remaining });
  } finally {
    // Always release the lock
    await redis.del(lockKey);
  }
});

// POST /stock/restore — used by PU3 for rollback on partial checkout failure
app.post('/stock/restore', async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  try {
    const remaining = await redis.incrby(`stock:${productId}`, quantity);
    res.json({ success: true, productId, restored: quantity, remaining });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(8084, () => console.log('PU4-Inventory :8084 — SETNX locking, stock in Data Grid (no DB)'));
