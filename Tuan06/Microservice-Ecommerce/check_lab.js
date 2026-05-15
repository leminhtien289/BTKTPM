const axios = require('axios');

const GW = process.env.GATEWAY_URL || 'http://localhost:8080';

let passed = 0;
let failed = 0;

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

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function run() {
  console.log(`\nLab B6 — Microservice Ecommerce Check`);
  console.log(`Gateway: ${GW}\n`);

  // 1. Health
  console.log('=== Health Checks ===');
  await test('Gateway /health responds', async () => {
    const r = await axios.get(`${GW}/health`);
    assert(r.data.status === 'ok', 'status != ok');
    assert(r.data.upstreams['product-service']  === 'up', 'product-service down');
    assert(r.data.upstreams['customer-service'] === 'up', 'customer-service down');
    assert(r.data.upstreams['order-service']    === 'up', 'order-service down');
    console.log(`       Upstreams:`, r.data.upstreams);
  });

  // 2. Products CRUD
  console.log('\n=== Product Service ===');
  let productId;
  await test('GET /api/products returns list', async () => {
    const r = await axios.get(`${GW}/api/products`);
    assert(Array.isArray(r.data) && r.data.length > 0, 'empty list');
    productId = r.data[0].id;
    console.log(`       ${r.data.length} products found, using id=${productId}`);
  });

  await test('GET /api/products/:id', async () => {
    const r = await axios.get(`${GW}/api/products/${productId}`);
    assert(r.data.id === productId, 'id mismatch');
    console.log(`       Product: ${r.data.name} — $${r.data.price}`);
  });

  let newProductId;
  await test('POST /api/products creates product', async () => {
    const r = await axios.post(`${GW}/api/products`, { name: 'Test Product', price: 49.99, stock: 10 });
    assert(r.status === 201, 'not 201');
    assert(r.data.name === 'Test Product', 'name mismatch');
    newProductId = r.data.id;
  });

  await test('PUT /api/products/:id updates product', async () => {
    const r = await axios.put(`${GW}/api/products/${newProductId}`, { price: 59.99 });
    assert(r.data.price === 59.99, 'price not updated');
  });

  await test('DELETE /api/products/:id deletes product', async () => {
    const r = await axios.delete(`${GW}/api/products/${newProductId}`);
    assert(r.data.message, 'no message');
  });

  // 3. Customers CRUD
  console.log('\n=== Customer Service ===');
  let customerId;
  await test('GET /api/customers returns list', async () => {
    const r = await axios.get(`${GW}/api/customers`);
    assert(Array.isArray(r.data) && r.data.length > 0, 'empty list');
    customerId = r.data[0].id;
    console.log(`       ${r.data.length} customers found, using id=${customerId}`);
  });

  await test('GET /api/customers/:id', async () => {
    const r = await axios.get(`${GW}/api/customers/${customerId}`);
    assert(r.data.id === customerId, 'id mismatch');
    console.log(`       Customer: ${r.data.name} <${r.data.email}>`);
  });

  let newCustomerId;
  await test('POST /api/customers creates customer', async () => {
    const r = await axios.post(`${GW}/api/customers`, {
      name: 'Test User', email: `test_${Date.now()}@example.com`, phone: '0999999999'
    });
    assert(r.status === 201, 'not 201');
    newCustomerId = r.data.id;
  });

  // 4. Orders (cross-service)
  console.log('\n=== Order Service (cross-service validation) ===');
  let orderId;
  await test('POST /api/orders — validates customer + product, creates order', async () => {
    const r = await axios.post(`${GW}/api/orders`, {
      customer_id: customerId,
      product_id:  productId,
      quantity: 2
    });
    assert(r.status === 201, 'not 201');
    assert(r.data.customer_id === customerId, 'customer_id mismatch');
    assert(r.data.product_id  === productId,  'product_id mismatch');
    assert(r.data.total_price > 0, 'total_price invalid');
    orderId = r.data.id;
    console.log(`       Order #${orderId}: ${r.data.customer_name} → ${r.data.product_name} x${r.data.quantity} = $${r.data.total_price}`);
  });

  await test('GET /api/orders/:id returns order', async () => {
    const r = await axios.get(`${GW}/api/orders/${orderId}`);
    assert(r.data.id === orderId, 'id mismatch');
    assert(r.data.status === 'pending', 'status not pending');
  });

  await test('POST /api/orders with invalid customer_id returns 404', async () => {
    try {
      await axios.post(`${GW}/api/orders`, { customer_id: 99999, product_id: productId });
      throw new Error('should have thrown');
    } catch (e) {
      assert(e.response?.status === 404, `expected 404, got ${e.response?.status}`);
    }
  });

  await test('POST /api/orders with invalid product_id returns 404', async () => {
    try {
      await axios.post(`${GW}/api/orders`, { customer_id: customerId, product_id: 99999 });
      throw new Error('should have thrown');
    } catch (e) {
      assert(e.response?.status === 404, `expected 404, got ${e.response?.status}`);
    }
  });

  // Summary
  console.log(`\n${'='.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) console.log('All checks PASSED — Lab B6 complete!');
  else console.log('Some checks FAILED — review the output above.');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
