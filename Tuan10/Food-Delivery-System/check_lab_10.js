// ============================================================
//  LAB B10 — KIỂM TRA ĐỐI CHIẾU Hybrid_Architecture_Lab.md
// ============================================================

const GATEWAY = 'http://localhost:8080';

let pass = 0;
let fail = 0;

function check(name, result, expected) {
  const ok = expected !== undefined ? result === expected : !!result;
  const icon = ok ? '✅' : '❌';
  console.log(`  ${icon} ${name}${expected !== undefined ? ` (kết quả: ${result}, kỳ vọng: ${expected})` : ` → ${JSON.stringify(result)}`}`);
  ok ? pass++ : fail++;
  return ok;
}

async function run() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  LAB B10 — Kiểm tra Hybrid Architecture (REST + Event)  ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // 1. Kiểm tra API Gateway Routing
  console.log('🎯 [1] API GATEWAY (:8080) — Central Routing:');
  
  // Test User route
  const loginRes = await fetch(`${GATEWAY}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'demoUser' })
  }).then(r => r.json());
  check('Gateway route /api/users thành công (chỉ tới User+Food Service)', loginRes.success);

  // Test Food route
  const foods = await fetch(`${GATEWAY}/api/foods`).then(r => r.json());
  check('Gateway route /api/foods thành công (chỉ tới User+Food Service)', foods.length > 0);
  const food = foods[0];

  // 2. Kiểm tra Hybrid Flow (REST + Event)
  console.log('\n🎯 [2] HYBRID FLOW — Order (REST) -> Payment (Event):');
  
  const startTime = Date.now();
  const orderRes = await fetch(`${GATEWAY}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: loginRes.user.id, foodId: food.id, price: food.price })
  }).then(r => r.json());
  const endTime = Date.now();
  
  check('Tạo Order thành công qua API Gateway', orderRes.success);
  check('Order Service phản hồi TỨC THÌ (REST Sync < 100ms)', (endTime - startTime) < 100);
  check('Order ban đầu có trạng thái PENDING', orderRes.order.status === 'PENDING');
  
  const orderId = orderRes.order.id;

  // 3. Kiểm tra tính bất đồng bộ (Asynchronous Event Processing)
  console.log('\n🎯 [3] ASYNCHRONOUS WORKER — Chờ Payment+Notification Service:');
  console.log('  ⏳ Chờ 2.5 giây để Payment Service xử lý Event ORDER_CREATED ngầm...');
  await new Promise(r => setTimeout(r, 2500));
  
  // Kiểm tra trạng thái mới nhất
  const orders = await fetch(`${GATEWAY}/api/orders`).then(r => r.json());
  const myOrder = orders.find(o => o.id === orderId);
  check('Order đã được Worker tự động cập nhật trạng thái (PAID hoặc PAYMENT_FAILED)', myOrder.status !== 'PENDING');

  // ── KẾT QUẢ ─────────────────────────────────────────────────
  const total = pass + fail;
  const pct = Math.round((pass / total) * 100);
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log(`║  KẾT QUẢ: ${pass}/${total} checks passed (${pct}%)${''.padEnd(24 - String(pass).length - String(total).length - String(pct).length)}║`);
  console.log(`║  ${fail === 0 ? '🎉 ĐẠT — Lab B10 PASS 10/10 điểm!' : `⚠️  ${fail} kiểm tra thất bại — cần xem lại`}${fail === 0 ? '                    ' : ''.padEnd(Math.max(0, 27-fail))}║`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');
}

run().catch(err => console.error('Lỗi:', err.message));
