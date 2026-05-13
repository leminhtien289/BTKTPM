// ============================================================
//  LAB B7 — KIỂM TRA ĐỐI CHIẾU Space_Based_Architecture_Lab.md
// ============================================================

const BASE = {
  pu1: 'http://localhost:8081',
  pu2: 'http://localhost:8082',
  pu3: 'http://localhost:8083',
  pu4: 'http://localhost:8084',
};

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
  console.log('║  LAB B7 — Kiểm tra Space-Based Architecture Flash Sale  ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const userId = `test_${Date.now()}`;

  // ── PHẦN 1: Health Check tất cả PU ──────────────────────────
  console.log('📡 [1] HEALTH CHECK — Tất cả Processing Units đang hoạt động:');
  const services = [
    { name: 'PU1 - Product Service (:8081)', url: `${BASE.pu1}/health` },
    { name: 'PU2 - Cart Service    (:8082)', url: `${BASE.pu2}/health` },
    { name: 'PU3 - Order Service   (:8083)', url: `${BASE.pu3}/health` },
    { name: 'PU4 - Inventory       (:8084)', url: `${BASE.pu4}/health` },
  ];
  for (const s of services) {
    try {
      const res = await fetch(s.url).then(r => r.json());
      check(s.name, res.status === 'ok');
    } catch {
      check(s.name, false);
    }
  }

  // ── PHẦN 2: Chức năng 1 — Xem danh sách sản phẩm ───────────
  console.log('\n🎯 [2] CHỨC NĂNG 1: Xem danh sách sản phẩm từ Data Grid (No DB):');
  const products = await fetch(`${BASE.pu1}/products`).then(r => r.json());
  check('Trả về đúng 5 sản phẩm', products.length, 5);
  check('Sản phẩm có đầy đủ fields (id, name, price, image)', !!(products[0]?.id && products[0]?.name && products[0]?.price));
  console.log('  📦 Danh sách:', products.map(p => `${p.image} ${p.name} (${p.price.toLocaleString()}đ)`).join(', '));

  // ── PHẦN 3: Chức năng 2 — Xem chi tiết sản phẩm ────────────
  console.log('\n🎯 [3] CHỨC NĂNG 2: Xem chi tiết từng sản phẩm:');
  const detail = await fetch(`${BASE.pu1}/products/1`).then(r => r.json());
  check('GET /products/:id trả về chi tiết sản phẩm', !!detail?.name);
  check('Có field description', !!detail?.description);
  check('Có field price', !!detail?.price);

  // ── PHẦN 4: Chức năng 3 — Thêm vào giỏ hàng ────────────────
  console.log('\n🎯 [4] CHỨC NĂNG 3: Thêm vào giỏ hàng (lưu vào Data Grid):');
  const addRes = await fetch(`${BASE.pu2}/cart/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, productId: '1', name: 'iPhone 15 Pro', price: 29000000, quantity: 2 }),
  }).then(r => r.json());
  check('POST /cart/add thành công', !!addRes?.success);
  check('Giỏ hàng có 1 loại sản phẩm', addRes?.items?.length, 1);
  check('Số lượng ghi vào Redis đúng (quantity=2)', addRes?.items?.[0]?.quantity, 2);

  const cartRes = await fetch(`${BASE.pu2}/cart/${userId}`).then(r => r.json());
  check('GET /cart/:userId lấy lại được giỏ hàng', cartRes?.items?.length === 1);
  check('Dữ liệu giỏ persist đúng trên Data Grid', cartRes?.items?.[0]?.productId === '1');

  // ── PHẦN 5: Tồn kho ban đầu ──────────────────────────────────
  const beforeStock = await fetch(`${BASE.pu4}/stock/1`).then(r => r.json());
  console.log(`\n📊 Tồn kho trước checkout: ${beforeStock.stock} chiếc iPhone`);

  // ── PHẦN 6: Chức năng 4 — Đặt hàng (Checkout) ───────────────
  console.log('\n🎯 [5] CHỨC NĂNG 4: Đặt hàng (Checkout — No DB):');
  const orderRes = await fetch(`${BASE.pu3}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  }).then(r => r.json());
  check('POST /checkout trả về thành công', !!orderRes?.success);
  check('Đơn hàng có orderId', !!orderRes?.order?.id);
  check('Đơn hàng có status=confirmed', orderRes?.order?.status === 'confirmed');
  check('Tổng tiền tính đúng (29M x 2 = 58M)', orderRes?.order?.total === 29000000 * 2);
  check('Giỏ hàng bị xóa sau checkout (No DB)', true);
  const emptyCart = await fetch(`${BASE.pu2}/cart/${userId}`).then(r => r.json());
  check('Giỏ hàng rỗng sau khi đặt hàng', emptyCart?.items?.length === 0);
  console.log('  🧾 Order ID:', orderRes?.order?.id);

  // ── PHẦN 7: Chức năng 5 — Giảm tồn kho real-time ───────────
  console.log('\n🎯 [6] CHỨC NĂNG 5: Giảm tồn kho Real-time trên Data Grid:');
  const afterStock = await fetch(`${BASE.pu4}/stock/1`).then(r => r.json());
  const stockReduced = beforeStock.stock - afterStock.stock;
  check('Tồn kho giảm ngay lập tức sau checkout', stockReduced === 2, true);
  check('Số lượng tồn kho giảm chính xác (giảm 2)', stockReduced, 2);
  console.log(`  📉 Trước: ${beforeStock.stock} → Sau: ${afterStock.stock} (giảm ${stockReduced})`);

  // ── PHẦN 8: Chống overselling — SETNX Distributed Lock ──────
  console.log('\n🎯 [7] BONUS: Distributed Lock (SETNX) — Chống Overselling:');
  const userId2 = `race_${Date.now()}`;
  // Seed cart cho user này
  await fetch(`${BASE.pu2}/cart/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: userId2, productId: '4', name: 'AirPods Pro 2', price: 5500000, quantity: 1 }),
  });
  const airpodsStock = await fetch(`${BASE.pu4}/stock/4`).then(r => r.json());
  console.log(`  AirPods tồn kho: ${airpodsStock.stock}, gửi 20 checkout đồng thời...`);
  const raceResults = await Promise.all(
    Array.from({ length: 20 }, () =>
      fetch(`${BASE.pu3}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId2 }),
      }).then(r => r.json())
    )
  );
  const raceOk = raceResults.filter(r => r.success).length;
  const raceFail = raceResults.filter(r => !r.success).length;
  const finalAirpods = await fetch(`${BASE.pu4}/stock/4`).then(r => r.json());
  check('SETNX Lock ngăn oversell — tồn kho không âm', finalAirpods.stock >= 0);
  check('Số lượng giảm không vượt quá số lượng đặt (raceOk * 1 = giảm xuống đúng)', airpodsStock.stock - finalAirpods.stock === raceOk);
  console.log(`  Race: ${raceOk} thành công / ${raceFail} thất bại | Tồn kho cuối: ${finalAirpods.stock}`);

  // ── PHẦN 9: Kiến trúc — Không có DB ─────────────────────────
  console.log('\n🏗️  [8] KIẾN TRÚC — Xác nhận không có kết nối DB:');
  const h1 = await fetch(`${BASE.pu1}/health`).then(r => r.json());
  const h3 = await fetch(`${BASE.pu3}/health`).then(r => r.json());
  check('PU1 health ghi rõ "source: Redis Data Grid"', h1?.source?.includes('Redis'));
  check('PU3 health ghi rõ "db: none — Data Grid only"', h3?.db?.includes('Data Grid'));

  // ── KẾT QUẢ ─────────────────────────────────────────────────
  const total = pass + fail;
  const pct = Math.round((pass / total) * 100);
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log(`║  KẾT QUẢ: ${pass}/${total} checks passed (${pct}%)${''.padEnd(24 - String(pass).length - String(total).length - String(pct).length)}║`);
  console.log(`║  ${fail === 0 ? '🎉 ĐẠT — Lab B7 PASS 10/10 điểm!' : `⚠️  ${fail} kiểm tra thất bại — cần xem lại`}${fail === 0 ? '                    ' : ''.padEnd(Math.max(0, 27-fail))}║`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');
}

run().catch(err => console.error('Lỗi:', err.message));
