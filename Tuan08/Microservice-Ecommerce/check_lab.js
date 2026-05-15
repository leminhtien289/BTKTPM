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
  console.log(`\nLab B8 — JWT Auth + ELK Logging\nGateway: ${GW}  ES: ${ES}  Kibana: ${KB}\n`);

  // ── ELK Health ──────────────────────────────────────────────────────────────
  console.log('=== ELK Stack ===');
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

  // ── Auth: Register & Login ──────────────────────────────────────────────────
  console.log('\n=== JWT Authentication ===');
  const testEmail = `testuser_${Date.now()}@example.com`;
  let token;

  await test('POST /auth/register — create user', async () => {
    const r = await axios.post(`${GW}/auth/register`, { name: 'Test User', email: testEmail, password: 'password123' });
    assert(r.status === 201, `expected 201, got ${r.status}`);
    assert(r.data.user?.email === testEmail, 'email mismatch');
    console.log(`       Registered: ${r.data.user.email}`);
  });

  await test('POST /auth/login — get JWT token', async () => {
    const r = await axios.post(`${GW}/auth/login`, { email: testEmail, password: 'password123' });
    assert(r.status === 200, `expected 200, got ${r.status}`);
    assert(r.data.token, 'no token returned');
    token = r.data.token;
    console.log(`       Token received (${token.slice(0, 20)}...)`);
  });

  await test('POST /auth/login with wrong password returns 401', async () => {
    try {
      await axios.post(`${GW}/auth/login`, { email: testEmail, password: 'wrongpassword' });
      throw new Error('should have returned 401');
    } catch (e) { assert(e.response?.status === 401, `expected 401, got ${e.response?.status}`); }
  });

  await test('GET /auth/me returns current user info', async () => {
    const r = await axios.get(`${GW}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    assert(r.data.email === testEmail, 'email mismatch');
  });

  await test('POST /auth/register duplicate email returns 409', async () => {
    try {
      await axios.post(`${GW}/auth/register`, { name: 'Dup', email: testEmail, password: 'abc123' });
      throw new Error('should have returned 409');
    } catch (e) { assert(e.response?.status === 409, `expected 409, got ${e.response?.status}`); }
  });

  // ── Protected Routes ────────────────────────────────────────────────────────
  console.log('\n=== Protected Routes (JWT Required) ===');
  await test('GET /api/products WITHOUT token returns 401', async () => {
    try {
      await axios.get(`${GW}/api/products`);
      throw new Error('should have returned 401');
    } catch (e) { assert(e.response?.status === 401, `expected 401, got ${e.response?.status}`); }
  });

  await test('GET /api/products WITH token returns 200', async () => {
    const r = await axios.get(`${GW}/api/products`, { headers: { Authorization: `Bearer ${token}` } });
    assert(Array.isArray(r.data) && r.data.length > 0, 'empty products list');
    console.log(`       ${r.data.length} products accessible with JWT`);
  });

  await test('GET /api/customers WITH token returns 200', async () => {
    const r = await axios.get(`${GW}/api/customers`, { headers: { Authorization: `Bearer ${token}` } });
    assert(Array.isArray(r.data), 'expected array');
  });

  await test('Invalid/expired token returns 401', async () => {
    try {
      await axios.get(`${GW}/api/products`, { headers: { Authorization: 'Bearer invalid.token.here' } });
      throw new Error('should have returned 401');
    } catch (e) { assert(e.response?.status === 401, `expected 401, got ${e.response?.status}`); }
  });

  // ── Full Flow with Auth ─────────────────────────────────────────────────────
  console.log('\n=== Full Order Flow with JWT ===');
  await test('POST /api/orders with JWT — full saga', async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const r = await axios.post(`${GW}/api/orders`, { customer_id: 1, product_id: 1, quantity: 1 }, { headers });
    assert(r.status === 201, `expected 201, got ${r.status}`);
    assert(['confirmed', 'payment_failed', 'payment_error'].includes(r.data.status), `unexpected status: ${r.data.status}`);
    console.log(`       Order #${r.data.id} → ${r.data.status}`);
  });

  // ── ELK Logs ─────────────────────────────────────────────────────────────────
  console.log('\n=== ELK Log Verification ===');
  await test('Elasticsearch has microservice-logs index', async () => {
    await new Promise(r => setTimeout(r, 3000)); // wait for Logstash to index
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

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log(`\n${'='.repeat(45)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) console.log('All checks PASSED — Lab B8 complete!');
  else console.log('Some checks FAILED — review output above.');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
