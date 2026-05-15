const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PRODUCT_SERVICE  = process.env.PRODUCT_SERVICE_URL  || 'http://localhost:8081';
const CUSTOMER_SERVICE = process.env.CUSTOMER_SERVICE_URL || 'http://localhost:8082';
const ORDER_SERVICE    = process.env.ORDER_SERVICE_URL    || 'http://localhost:8083';

async function proxy(req, res, targetBase, stripPrefix) {
  const path = req.path.replace(stripPrefix, '') || '/';
  const url  = `${targetBase}${path}`;
  try {
    const response = await axios({
      method:  req.method,
      url,
      data:    req.body,
      params:  req.query,
      headers: { 'content-type': 'application/json' },
      timeout: 5000,
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    if (err.response) return res.status(err.response.status).json(err.response.data);
    res.status(503).json({ error: 'Service unavailable', service: url });
  }
}

app.all('/api/products*', (req, res) => proxy(req, res, PRODUCT_SERVICE,  '/api/products'));
app.all('/api/customers*',(req, res) => proxy(req, res, CUSTOMER_SERVICE, '/api/customers'));
app.all('/api/orders*',   (req, res) => proxy(req, res, ORDER_SERVICE,    '/api/orders'));

app.get('/health', async (req, res) => {
  const checks = await Promise.allSettled([
    axios.get(`${PRODUCT_SERVICE}/health`,  { timeout: 2000 }),
    axios.get(`${CUSTOMER_SERVICE}/health`, { timeout: 2000 }),
    axios.get(`${ORDER_SERVICE}/health`,    { timeout: 2000 }),
  ]);
  res.json({
    status: 'ok',
    service: 'api-gateway',
    port: PORT,
    upstreams: {
      'product-service':  checks[0].status === 'fulfilled' ? 'up' : 'down',
      'customer-service': checks[1].status === 'fulfilled' ? 'up' : 'down',
      'order-service':    checks[2].status === 'fulfilled' ? 'up' : 'down',
    },
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`API Gateway listening on port ${PORT}`));
