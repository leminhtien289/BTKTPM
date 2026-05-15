const axios = require('axios');

const GW = process.env.GATEWAY_URL || 'http://localhost:8080';
const ES = process.env.ES_URL      || 'http://localhost:9200';
const KB = process.env.KB_URL      || 'http://localhost:5601';

let passed = 0, failed = 0;
async function test(label, fn) {
  try { await fn(); console.log(`  [PASS] ${label}`); passed++; }
  catch (e) {
    const msg = e.response ? `HTTP ${e.response.status}: ${JSON.stringify(e.response.data)}` : e.message;
    console.log(`  [FAIL] ${label} — ${msg}`); failed++;
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

async function run() {
  console.log(`\nLab B9 — Redis Caching\nGateway: ${GW}  ES: ${ES}  Kibana: ${KB}\n`);

  // ── Auth: get a token for all protected route tests ──────────────────────────
  console.log('=== JWT Auth (setup) ===');
  const testEmail = `testuser_${Date.now()}@example.com`;
  let token;

  await test('POST /auth/register — create user', async () => {
    const r = await axios.post(`${GW}/auth/register`, { name: 'Test User', email: testEmail, password: 'password123' });
    assert(r.status === 201, `expected 201, got ${r.status}`);
  });

  await test('POST /auth/login — get JWT token', async () => {
    const r = await axios.post(`${GW}/auth/login`, { email: testEmail, password: 'password123' });
    assert(r.status === 200 && r.data.token, 'no token returned');
    token = r.data.token;
    console.log(`       Token received (${token.slice(0, 20)}...)`);
  });

  // ── Redis Health ──────────────────────────────────────────────────────────────
  console.log('\n=== Redis Health ===');
  await test('Redis is up (via gateway /health)', async () => {
    const r = await axios.get(`${GW}/health`, { timeout: 5000 });
    assert(r.data.redis === 'up', `Redis status: ${r.data.redis}`);
    console.log(`       Redis status: ${r.data.redis}`);
  });

  // ── Cache-Aside: Product List ─────────────────────────────────────────────────
  console.log('\n=== Redis Cache — Product List ===');
  const headers = { Authorization: `Bearer ${token}` };

  await test('GET /api/products — first call is cache MISS', async () => {
    const r = await axios.get(`${GW}/api/products`, { headers });
    assert(Array.isArray(r.data) && r.data.length > 0, 'empty products list');
    assert(r.headers['x-cache'] === 'MISS', `expected X-Cache: MISS, got: ${r.headers['x-cache']}`);
    console.log(`       ${r.data.length} products, X-Cache: ${r.headers['x-cache']}`);
  });

  await test('GET /api/products — second call is cache HIT', async () => {
    const r = await axios.get(`${GW}/api/products`, { headers });
    assert(r.headers['x-cache'] === 'HIT', `expected X-Cache: HIT, got: ${r.headers['x-cache']}`);
    console.log(`       X-Cache: ${r.headers['x-cache']} (served from Redis)`);
  });

  // ── Cache-Aside: Single Product ───────────────────────────────────────────────
  console.log('\n=== Redis Cache — Single Product ===');

  await test('GET /api/products/1 — first call is cache MISS', async () => {
    const r = await axios.get(`${GW}/api/products/1`, { headers });
    assert(r.data.id === 1, 'wrong product');
    assert(r.headers['x-cache'] === 'MISS', `expected X-Cache: MISS, got: ${r.headers['x-cache']}`);
    console.log(`       Product: ${r.data.name}, X-Cache: ${r.headers['x-cache']}`);
  });

  await test('GET /api/products/1 — second call is cache HIT', async () => {
    const r = await axios.get(`${GW}/api/products/1`, { headers });
    assert(r.headers['x-cache'] === 'HIT', `expected X-Cache: HIT, got: ${r.headers['x-cache']}`);
    console.log(`       X-Cache: ${r.headers['x-cache']} (served from Redis)`);
  });

  // ── Cache Invalidation ────────────────────────────────────────────────────────
  console.log('\n=== Cache Invalidation ===');

  await test('PUT /api/products/1 — update triggers cache invalidation', async () => {
    const r = await axios.put(`${GW}/api/products/1`, { stock: 49 }, { headers });
    assert(r.status === 200, `expected 200, got ${r.status}`);
    console.log(`       Updated product/1 stock → ${r.data.stock}`);
  });

  await test('GET /api/products/1 after PUT — cache is MISS (invalidated)', async () => {
    const r = await axios.get(`${GW}/api/products/1`, { headers });
    assert(r.headers['x-cache'] === 'MISS', `expected X-Cache: MISS after invalidation, got: ${r.headers['x-cache']}`);
    console.log(`       X-Cache: ${r.headers['x-cache']} — cache correctly cleared after update`);
  });

  await test('GET /api/products after PUT — list cache is MISS (invalidated)', async () => {
    const r = await axios.get(`${GW}/api/products`, { headers });
    assert(r.headers['x-cache'] === 'MISS', `expected X-Cache: MISS after invalidation, got: ${r.headers['x-cache']}`);
    console.log(`       X-Cache: ${r.headers['x-cache']} — list cache correctly cleared after update`);
  });

  // ── Rate Limiter (Redis-backed) ───────────────────────────────────────────────
  console.log('\n=== Redis-backed Rate Limiter ===');
  await test('Rate limiter headers present on response', async () => {
    const r = await axios.get(`${GW}/api/products`, { headers });
    const limit = r.headers['ratelimit-limit'] || r.headers['x-ratelimit-limit'];
    assert(limit, 'no RateLimit header found');
    console.log(`       RateLimit-Limit: ${limit}`);
  });

  // ── JWT Security (inherited from B8) ─────────────────────────────────────────
  console.log('\n=== JWT Security ===');
  await test('GET /api/products WITHOUT token returns 401', async () => {
    try {
      await axios.get(`${GW}/api/products`);
      throw new Error('should have returned 401');
    } catch (e) { assert(e.response?.status === 401, `expected 401, got ${e.response?.status}`); }
  });

  await test('Invalid/expired token returns 401', async () => {
    try {
      await axios.get(`${GW}/api/products`, { headers: { Authorization: 'Bearer invalid.token.here' } });
      throw new Error('should have returned 401');
    } catch (e) { assert(e.response?.status === 401, `expected 401, got ${e.response?.status}`); }
  });

  await test('POST /auth/login with wrong password returns 401', async () => {
    try {
      await axios.post(`${GW}/auth/login`, { email: testEmail, password: 'wrongpassword' });
      throw new Error('should have returned 401');
    } catch (e) { assert(e.response?.status === 401, `expected 401, got ${e.response?.status}`); }
  });

  await test('POST /auth/register duplicate email returns 409', async () => {
    try {
      await axios.post(`${GW}/auth/register`, { name: 'Dup', email: testEmail, password: 'abc123' });
      throw new Error('should have returned 409');
    } catch (e) { assert(e.response?.status === 409, `expected 409, got ${e.response?.status}`); }
  });

  // ── Full Order Flow ───────────────────────────────────────────────────────────
  console.log('\n=== Full Order Flow with JWT ===');
  await test('POST /api/orders with JWT — full saga', async () => {
    const r = await axios.post(`${GW}/api/orders`, { customer_id: 1, product_id: 2, quantity: 1 }, { headers });
    assert(r.status === 201, `expected 201, got ${r.status}`);
    assert(['confirmed', 'payment_failed', 'payment_error'].includes(r.data.status), `unexpected status: ${r.data.status}`);
    console.log(`       Order #${r.data.id} → ${r.data.status}`);
  });

  // ── ELK Stack ─────────────────────────────────────────────────────────────────
  console.log('\n=== ELK Stack ===');
  await test('Elasticsearch is up', async () => {
    const r = await axios.get(`${ES}`, { timeout: 5000 });
    assert(r.data.tagline === 'You Know, for Search', 'unexpected ES response');
    console.log(`       ES version: ${r.data.version?.number}`);
  });

  await test('Kibana is up', async () => {
    const r = await axios.get(`${KB}/api/status`, { timeout: 5000 });
    assert(r.data.status?.overall?.level === 'available' || r.status === 200, 'Kibana not ready');
    console.log(`       Kibana status: ${r.data.status?.overall?.level ?? 'ok'}`);
  });

  await test('Elasticsearch has microservice-logs index', async () => {
    await new Promise(r => setTimeout(r, 3000));
    const r = await axios.get(`${ES}/_cat/indices/microservice-logs-*?format=json`, { timeout: 5000 });
    assert(Array.isArray(r.data) && r.data.length > 0, 'no microservice-logs index found');
    const docsCount = r.data.reduce((sum, i) => sum + parseInt(i['docs.count'] || 0), 0);
    console.log(`       Index found with ${docsCount} documents`);
  });

  await test('Logs contain api-gateway entries', async () => {
    const r = await axios.post(`${ES}/microservice-logs-*/_search`, {
      query: { term: { service: 'api-gateway' } }, size: 1,
    }, { timeout: 5000 });
    assert(r.data.hits?.total?.value > 0, 'no api-gateway logs found');
    console.log(`       api-gateway logs: ${r.data.hits.total.value} entries`);
  });

  // ── Summary ───────────────────────────────────────────────────────────────────
  console.log(`\n${'='.repeat(45)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) console.log('All checks PASSED — Lab B9 complete!');
  else console.log('Some checks FAILED — review output above.');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
