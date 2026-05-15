const express = require('express');
const axios = require('axios');
const CircuitBreaker = require('opossum');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());

// ── Rate Limiter ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});
app.use(limiter);

// ── Service URLs ──────────────────────────────────────────────────────────────
const SERVICES = {
  products:  process.env.PRODUCT_SERVICE_URL   || 'http://localhost:8081',
  customers: process.env.CUSTOMER_SERVICE_URL  || 'http://localhost:8082',
  orders:    process.env.ORDER_SERVICE_URL     || 'http://localhost:8083',
  payments:  process.env.PAYMENT_SERVICE_URL   || 'http://localhost:8084',
  inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:8085',
  shipments: process.env.SHIPPING_SERVICE_URL  || 'http://localhost:8086',
};

// ── Core proxy function (wrapped by circuit breaker) ─────────────────────────
// Only throws on 5xx / network errors — 4xx are returned normally (not CB failures)
async function callUpstream(method, url, body, params) {
  try {
    const response = await axios({ method, url, data: body, params, timeout: 4500 });
    return { data: response.data, status: response.status };
  } catch (err) {
    if (err.response && err.response.status < 500) {
      return { data: err.response.data, status: err.response.status };
    }
    throw err; // 5xx / network error → circuit breaker counts as failure
  }
}

// ── Circuit Breaker per service ───────────────────────────────────────────────
const CB_OPTIONS = {
  timeout: 5000,                 // Time Limiter: fail if upstream > 5s
  errorThresholdPercentage: 50,  // Open if ≥ 50% of requests fail
  resetTimeout: 15000,           // Try again after 15s (half-open)
  volumeThreshold: 3,            // Need at least 3 requests before calculating
};

const breakers = {};
for (const [name, url] of Object.entries(SERVICES)) {
  const breaker = new CircuitBreaker(callUpstream, CB_OPTIONS);

  breaker.fallback(() => ({
    data: { error: `${name} is temporarily unavailable (circuit open)`, service: name },
    status: 503,
  }));

  breaker.on('open',     () => console.warn(`[CB] ${name} → OPEN  (requests blocked)`));
  breaker.on('halfOpen', () => console.info (`[CB] ${name} → HALF-OPEN (testing...)`));
  breaker.on('close',    () => console.info (`[CB] ${name} → CLOSED (recovered)`));

  breakers[name] = breaker;
}

// ── Generic route factory ─────────────────────────────────────────────────────
function makeRoute(breakerKey, targetBase, stripPrefix) {
  return async (req, res) => {
    const path = req.path.replace(stripPrefix, '') || '/';
    const url  = `${targetBase}${path}`;
    try {
      const result = await breakers[breakerKey].fire(req.method, url, req.body, req.query);
      res.status(result.status).json(result.data);
    } catch (err) {
      res.status(503).json({ error: 'Service error', details: err.message });
    }
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.all('/api/products*',  makeRoute('products',  SERVICES.products,  '/api/products'));
app.all('/api/customers*', makeRoute('customers', SERVICES.customers, '/api/customers'));
app.all('/api/orders*',    makeRoute('orders',    SERVICES.orders,    '/api/orders'));
app.all('/api/payments*',  makeRoute('payments',  SERVICES.payments,  '/api/payments'));
app.all('/api/inventory*', makeRoute('inventory', SERVICES.inventory, '/api/inventory'));
app.all('/api/shipments*', makeRoute('shipments', SERVICES.shipments, '/api/shipments'));

// ── Health (with circuit breaker state) ──────────────────────────────────────
app.get('/health', async (req, res) => {
  const results = await Promise.all(
    Object.entries(SERVICES).map(async ([name, url]) => {
      let upstreamStatus = 'down';
      try {
        await axios.get(`${url}/health`, { timeout: 2000 });
        upstreamStatus = 'up';
      } catch {}
      return [name, {
        status:  upstreamStatus,
        circuit: breakers[name].opened ? 'open' : breakers[name].halfOpen ? 'half-open' : 'closed',
      }];
    })
  );
  res.json({ status: 'ok', service: 'api-gateway', upstreams: Object.fromEntries(results) });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`API Gateway (Circuit Breaker + Rate Limiter) on port ${PORT}`));
