const express = require('express');
const cors = require('cors');
const Redis = require('ioredis');

const app = express();
app.use(cors());
app.use(express.json());

const redis = new Redis({ host: process.env.REDIS_HOST || 'localhost', port: 6379 });
redis.on('error', err => console.error('[Redis]', err.message));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'PU1-Product', source: 'Redis Data Grid' }));

// GET /products — load all products from Data Grid (no DB)
app.get('/products', async (req, res) => {
  try {
    const data = await redis.get('products');
    res.json(data ? JSON.parse(data) : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /products/:id — load single product from Data Grid
app.get('/products/:id', async (req, res) => {
  try {
    const data = await redis.get(`product:${req.params.id}`);
    if (!data) return res.status(404).json({ error: 'Product not found' });
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(8081, () => console.log('PU1-Product :8081 — reads from Redis Data Grid (no DB)'));
