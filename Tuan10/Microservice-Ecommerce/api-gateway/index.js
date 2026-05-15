const express  = require('express');
const axios     = require('axios');
const jwt       = require('jsonwebtoken');
const bcrypt    = require('bcryptjs');
const Database  = require('better-sqlite3');
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const CircuitBreaker = require('opossum');
const Redis     = require('ioredis');
const path      = require('path');

const app = express();
app.use(express.json());

// ── Config ────────────────────────────────────────────────────────────────────
const JWT_SECRET     = process.env.JWT_SECRET     || 'dev_secret_change_in_prod';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const LOGSTASH_URL   = process.env.LOGSTASH_URL   || null;
const SERVICE_NAME   = process.env.SERVICE_NAME   || 'api-gateway';

// ── Redis Client ──────────────────────────────────────────────────────────────
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
redisClient.on('error', () => {});

// ── Logger → Logstash ─────────────────────────────────────────────────────────
function log(level, message, meta = {}) {
  const entry = JSON.stringify({
    '@timestamp': new Date().toISOString(),
    level, service: SERVICE_NAME, message, ...meta,
  });
  console.log(entry);
  if (!LOGSTASH_URL) return;
  axios.post(LOGSTASH_URL, JSON.parse(entry)).catch(() => {});
}

// ── Auth DB ───────────────────────────────────────────────────────────────────
const authDb = new Database(process.env.AUTH_DB_PATH || path.join('/data', 'auth.db'));
authDb.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    email      TEXT    NOT NULL UNIQUE,
    password   TEXT    NOT NULL,
    role       TEXT    NOT NULL DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ── Redis-backed Rate Limiter ─────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
  store: new RedisStore({
    sendCommand: (command, ...args) => redisClient.call(command, ...args),
  }),
}));

// ── Request Logger Middleware ─────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    log('info', `${req.method} ${req.path}`, {
      method: req.method, path: req.path,
      status: res.statusCode, duration_ms: Date.now() - start,
      ip: req.ip,
    });
  });
  next();
});

// ── JWT Middleware ────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Missing Authorization: Bearer <token>' });
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch (e) {
    log('warn', 'JWT validation failed', { error: e.message, path: req.path });
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ── Auth Routes (public) ──────────────────────────────────────────────────────
app.post('/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'name, email and password required' });
  if (password.length < 6)
    return res.status(400).json({ error: 'password must be at least 6 characters' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const r = authDb.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)')
                     .run(name, email, hashed);
    const user = authDb.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?')
                        .get(r.lastInsertRowid);
    log('info', 'User registered', { userId: user.id, email: user.email });
    res.status(201).json({ message: 'Registered successfully', user });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already registered' });
    throw e;
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'email and password required' });

  const user = authDb.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    log('warn', 'Failed login attempt', { email });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  log('info', 'User logged in', { userId: user.id, email: user.email });
  res.json({
    message: 'Login successful',
    token,
    expiresIn: JWT_EXPIRES_IN,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

app.get('/auth/me', requireAuth, (req, res) => {
  const user = authDb.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// ── Service Proxy with Circuit Breaker ───────────────────────────────────────
const SERVICES = {
  products:  process.env.PRODUCT_SERVICE_URL   || 'http://localhost:8081',
  customers: process.env.CUSTOMER_SERVICE_URL  || 'http://localhost:8082',
  orders:    process.env.ORDER_SERVICE_URL     || 'http://localhost:8083',
  payments:  process.env.PAYMENT_SERVICE_URL   || 'http://localhost:8084',
  inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:8085',
  shipments: process.env.SHIPPING_SERVICE_URL  || 'http://localhost:8086',
};

async function callUpstream(method, url, body, params) {
  try {
    const r = await axios({ method, url, data: body, params, timeout: 4500 });
    return { data: r.data, status: r.status, headers: r.headers };
  } catch (err) {
    if (err.response && err.response.status < 500)
      return { data: err.response.data, status: err.response.status, headers: err.response.headers };
    throw err;
  }
}

const CB_OPTIONS = { timeout: 5000, errorThresholdPercentage: 50, resetTimeout: 15000, volumeThreshold: 3 };
const breakers = {};
for (const [name, url] of Object.entries(SERVICES)) {
  const breaker = new CircuitBreaker(callUpstream, CB_OPTIONS);
  breaker.fallback(() => ({ data: { error: `${name} unavailable (circuit open)`, service: name }, status: 503 }));
  breaker.on('open',     () => log('warn',  `Circuit OPEN for ${name}`));
  breaker.on('halfOpen', () => log('info',  `Circuit HALF-OPEN for ${name}`));
  breaker.on('close',    () => log('info',  `Circuit CLOSED for ${name}`));
  breakers[name] = breaker;
}

function makeRoute(breakerKey, targetBase, stripPrefix) {
  return async (req, res) => {
    const path = req.path.replace(stripPrefix, '') || '/';
    try {
      const result = await breakers[breakerKey].fire(req.method, `${targetBase}${path}`, req.body, req.query);
      if (result.headers?.['x-cache']) res.set('X-Cache', result.headers['x-cache']);
      res.status(result.status).json(result.data);
    } catch (err) {
      log('error', `Upstream error: ${breakerKey}`, { error: err.message });
      res.status(503).json({ error: 'Service error', details: err.message });
    }
  };
}

// All /api/* routes require JWT
app.use('/api', requireAuth);

app.all('/api/products*',  makeRoute('products',  SERVICES.products,  '/api/products'));
app.all('/api/customers*', makeRoute('customers', SERVICES.customers, '/api/customers'));
app.all('/api/orders*',    makeRoute('orders',    SERVICES.orders,    '/api/orders'));
app.all('/api/payments*',  makeRoute('payments',  SERVICES.payments,  '/api/payments'));
app.all('/api/inventory*', makeRoute('inventory', SERVICES.inventory, '/api/inventory'));
app.all('/api/shipments*', makeRoute('shipments', SERVICES.shipments, '/api/shipments'));

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const results = await Promise.all(
    Object.entries(SERVICES).map(async ([name, url]) => {
      let status = 'down';
      try { await axios.get(`${url}/health`, { timeout: 2000 }); status = 'up'; } catch {}
      return [name, { status, circuit: breakers[name].opened ? 'open' : 'closed' }];
    })
  );
  let redisStatus = 'down';
  try { await redisClient.ping(); redisStatus = 'up'; } catch {}
  res.json({
    status: 'ok', service: SERVICE_NAME,
    redis: redisStatus,
    upstreams: Object.fromEntries(results),
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  log('info', `API Gateway started`, { port: PORT, jwt: 'enabled', redis: 'enabled', elk: !!LOGSTASH_URL });
});
