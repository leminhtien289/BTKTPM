const axios = require('axios');

const GW = process.env.GATEWAY_URL || 'http://localhost:8080';
let passed = 0, failed = 0;

async function test(label, fn) {
  try {
    await fn();
    console.log(`  [PASS] ${label}`);
    passed++;
  } catch (e) {
    const msg = e.response ? `HTTP ${e.response.status}: ${JSON.stringify(e.response.data)}` : e.message;
    console.log(`  [FAIL] ${label} — ${msg}`);
    failed++;
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

async function run() {
  console.log(`\nLab B7 — Microservice Ecommerce (Fault Tolerance)\nGateway: ${GW}\n`);

  // ── Health & Circuit Breaker state ──────────────────────────────────────────
  console.log('=== Health + Circuit Breaker ===');
  await test('All 6 upstreams up, all circuits closed', async () => {
    const r = await axios.get(`${GW}/health`);
    assert(r.data.status === 'ok', 'gateway not ok');
    const up = r.data.upstreams;
    for (const [name, info] of Object.entries(up)) {
      assert(info.status  === 'up',     `${name} is down`);
      assert(info.circuit === 'closed', `${name} circuit is ${info.circuit}`);
    }
    console.log('       Upstreams:', Object.fromEntries(
      Object.entries(up).map(([k, v]) => [k, `${v.status}/${v.circuit}`])
    ));
  });

  // ── Inventory Service ────────────────────────────────────────────────────────
  console.log('\n=== Inventory Service ===');
  let initialStock;
  await test('GET /api/inventory returns all products', async () => {
    const r = await axios.get(`${GW}/api/inventory`);
    assert(Array.isArray(r.data) && r.data.length > 0, 'empty inventory');
    initialStock = r.data[0].quantity;
    console.log(`       ${r.data.length} items. Product 1 stock: ${initialStock}`);
  });

  await test('GET /api/inventory/1 returns product 1 stock', async () => {
    const r = await axios.get(`${GW}/api/inventory/1`);
    assert(r.data.product_id === 1, 'wrong product_id');
    assert(typeof r.data.quantity === 'number', 'quantity not a number');
  });

  await test('PUT /api/inventory/1/reduce — reduce stock', async () => {
    const before = (await axios.get(`${GW}/api/inventory/1`)).data.quantity;
    await axios.put(`${GW}/api/inventory/1/reduce`, { quantity: 1 });
    const after  = (await axios.get(`${GW}/api/inventory/1`)).data.quantity;
    assert(after === before - 1, `expected ${before - 1}, got ${after}`);
    // restore
    await axios.put(`${GW}/api/inventory/1/restore`, { quantity: 1 });
  });

  await test('PUT /api/inventory/1/reduce with excess quantity returns 422', async () => {
    try {
      await axios.put(`${GW}/api/inventory/1/reduce`, { quantity: 999999 });
      throw new Error('should have thrown');
    } catch (e) {
      assert(e.response?.status === 422, `expected 422, got ${e.response?.status}`);
    }
  });

  // ── Payment Service ──────────────────────────────────────────────────────────
  console.log('\n=== Payment Service ===');
  await test('POST /api/payments creates payment (may succeed or fail)', async () => {
    const r = await axios.post(`${GW}/api/payments`, { order_id: 9999, amount: 99.99 });
    assert(r.status === 201, 'not 201');
    assert(['completed', 'failed'].includes(r.data.status), 'unexpected status');
    console.log(`       Payment result: ${r.data.status} (${r.data.message})`);
  });

  await test('POST /api/payments/:id/refund — refund a completed payment', async () => {
    // create completed payment (retry until we get one)
    let paymentId = null;
    for (let i = 0; i < 10; i++) {
      const r = await axios.post(`${GW}/api/payments`, { order_id: 9998, amount: 50 });
      if (r.data.status === 'completed') { paymentId = r.data.id; break; }
    }
    if (!paymentId) { console.log('       (skipped — no successful payment in 10 tries)'); return; }
    const r = await axios.post(`${GW}/api/payments/${paymentId}/refund`);
    assert(r.data.status === 'refunded', `expected refunded, got ${r.data.status}`);
  });

  // ── Shipping Service ─────────────────────────────────────────────────────────
  console.log('\n=== Shipping Service ===');
  let shipmentId;
  await test('POST /api/shipments creates shipment', async () => {
    const r = await axios.post(`${GW}/api/shipments`, {
      order_id: 9999, customer_name: 'Test User', address: 'Hanoi'
    });
    assert(r.status === 201, 'not 201');
    shipmentId = r.data.id;
  });

  await test('PATCH /api/shipments/:id/status → in_transit', async () => {
    const r = await axios.patch(`${GW}/api/shipments/${shipmentId}/status`, { status: 'in_transit' });
    assert(r.data.status === 'in_transit', 'status not updated');
  });

  await test('PATCH /api/shipments/:id/status → delivered', async () => {
    const r = await axios.patch(`${GW}/api/shipments/${shipmentId}/status`, { status: 'delivered' });
    assert(r.data.status === 'delivered', 'status not updated');
  });

  // ── Full Order Saga (cross all 6 services) ───────────────────────────────────
  console.log('\n=== Full Order Saga (validate → inventory → order → payment → ship) ===');
  await test('POST /api/orders — full saga completes', async () => {
    const stockBefore = (await axios.get(`${GW}/api/inventory/1`)).data.quantity;
    const r = await axios.post(`${GW}/api/orders`, {
      customer_id: 1, product_id: 1, quantity: 1
    });
    assert(r.status === 201, 'not 201');
    assert(['confirmed', 'payment_failed', 'payment_error'].includes(r.data.status),
           `unexpected status: ${r.data.status}`);

    const stockAfter = (await axios.get(`${GW}/api/inventory/1`)).data.quantity;
    if (r.data.status === 'confirmed') {
      assert(stockAfter === stockBefore - 1, `stock should have decreased`);
      assert(r.data.payment_id != null, 'missing payment_id');
      console.log(`       Order #${r.data.id} CONFIRMED — payment_id=${r.data.payment_id} shipment_id=${r.data.shipment_id}`);
    } else {
      assert(stockAfter === stockBefore, `stock should have been restored on ${r.data.status}`);
      console.log(`       Order #${r.data.id} ${r.data.status.toUpperCase()} — inventory restored ✓`);
    }
  });

  await test('POST /api/orders with invalid customer returns 404', async () => {
    try {
      await axios.post(`${GW}/api/orders`, { customer_id: 99999, product_id: 1 });
      throw new Error('should have thrown');
    } catch (e) { assert(e.response?.status === 404, `expected 404, got ${e.response?.status}`); }
  });

  // ── Rate Limiter header check ─────────────────────────────────────────────────
  console.log('\n=== Rate Limiter ===');
  await test('Response headers include RateLimit-Limit', async () => {
    const r = await axios.get(`${GW}/health`);
    const hasRateLimit = r.headers['ratelimit-limit'] || r.headers['x-ratelimit-limit'];
    assert(hasRateLimit, 'missing rate-limit header');
    console.log(`       Rate limit header: ${hasRateLimit} req/window`);
  });

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log(`\n${'='.repeat(45)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) console.log('All checks PASSED — Lab B7 complete!');
  else console.log('Some checks FAILED — review output above.');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
