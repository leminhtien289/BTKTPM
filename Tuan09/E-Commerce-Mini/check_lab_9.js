// ============================================================
//  LAB B9 — KIỂM TRA ĐỐI CHIẾU Microservices_Architecture_Lab.md
// ============================================================

const fs = require('fs');

const API = {
  USER: 'http://localhost:8081',
  PRODUCT: 'http://localhost:8082',
  CART: 'http://localhost:8083',
  ORDER: 'http://localhost:8084',
  PAYMENT: 'http://localhost:8085'
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
  console.log('║  LAB B9 — Kiểm tra Microservices Architecture           ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // 1. Kiểm tra Cấu trúc Database riêng biệt
  console.log('🏗️  [1] KIẾN TRÚC — MỖI SERVICE CÓ DB RIÊNG:');
  const dbs = [
    { service: 'User', file: './user-service/users.db' },
    { service: 'Product', file: './product-service/products.db' },
    { service: 'Cart', file: './cart-service/cart.db' },
    { service: 'Order', file: './order-service/orders.db' },
    { service: 'Payment', file: './payment-service/payments.db' }
  ];
  for (const db of dbs) {
    check(`${db.service} có Database riêng (${db.file})`, fs.existsSync(db.file));
  }

  // 2. Kiểm tra User Service
  console.log('\n🎯 [2] USER SERVICE (:8081) — Quản lý User:');
  const loginRes = await fetch(`${API.USER}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'demoUser', password: 'demo123' })
  }).then(r => r.json());
  check('Đăng nhập thành công', loginRes.success);
  const userId = loginRes.user.id;

  // 3. Kiểm tra Product Service
  console.log('\n🎯 [3] PRODUCT SERVICE (:8082) — Quản lý Sản phẩm:');
  const products = await fetch(`${API.PRODUCT}/products`).then(r => r.json());
  check('Lấy danh sách sản phẩm thành công', products.length > 0);
  const product1 = products[0];
  const product2 = products[1];

  // 4. Kiểm tra Cart Service (Chỉ lưu productId)
  console.log('\n🎯 [4] CART SERVICE (:8083) — Quản lý Giỏ hàng (Không lưu details):');
  // Xóa giỏ cũ nếu có
  await fetch(`${API.CART}/cart/${userId}`, { method: 'DELETE' });
  
  await fetch(`${API.CART}/cart/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, productId: product1.id, quantity: 2 })
  });
  
  const cartData = await fetch(`${API.CART}/cart/${userId}`).then(r => r.json());
  check('Thêm vào giỏ hàng thành công', cartData.items.length === 1);
  check('Chỉ lưu productId, không lưu name/price (nguyên tắc Microservices)', 
        cartData.items[0].productId === product1.id && !cartData.items[0].name && !cartData.items[0].price);

  // 5. Kiểm tra Order Service (Lấy từ Cart -> Product -> Tạo order)
  console.log('\n🎯 [5] ORDER SERVICE (:8084) — Flow Đặt hàng (Cross-service):');
  const orderRes = await fetch(`${API.ORDER}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  }).then(r => r.json());
  
  check('Tạo Order thành công', orderRes.success);
  check('Tổng tiền được tính toán đúng (lấy giá từ Product Service)', orderRes.order.totalAmount === product1.price * 2);
  check('Trạng thái Order ban đầu là PENDING', orderRes.order.status === 'PENDING');
  
  // Kiểm tra cart đã xóa
  const emptyCart = await fetch(`${API.CART}/cart/${userId}`).then(r => r.json());
  check('Giỏ hàng đã tự động xóa sau khi order', emptyCart.items.length === 0);

  const orderId = orderRes.order.id;

  // 6. Kiểm tra Payment Service
  console.log('\n🎯 [6] PAYMENT SERVICE (:8085) — Flow Thanh toán (Update Order):');
  // Thử thanh toán đến khi pass (vì có 15% fail)
  let paymentRes;
  for(let i=0; i<5; i++) {
    paymentRes = await fetch(`${API.PAYMENT}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, amount: orderRes.order.totalAmount })
    }).then(r => r.json());
    if (paymentRes.success) break;
  }
  
  check('Thanh toán thành công (hoặc qua vài lần retry do giả lập)', paymentRes.success);
  check('Payment trả về transactionId', !!paymentRes.transactionId);

  // Chờ một chút cho async PATCH order status
  await new Promise(r => setTimeout(r, 500));
  
  // Kiểm tra trạng thái order đã đổi thành PAID chưa
  const finalOrders = await fetch(`${API.ORDER}/orders?userId=${userId}`).then(r => r.json());
  const myOrder = finalOrders.find(o => o.id === orderId);
  check('Order Service đã tự động đổi status sang PAID sau khi thanh toán', myOrder.status === 'PAID');

  // ── KẾT QUẢ ─────────────────────────────────────────────────
  const total = pass + fail;
  const pct = Math.round((pass / total) * 100);
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log(`║  KẾT QUẢ: ${pass}/${total} checks passed (${pct}%)${''.padEnd(24 - String(pass).length - String(total).length - String(pct).length)}║`);
  console.log(`║  ${fail === 0 ? '🎉 ĐẠT — Lab B9 PASS 10/10 điểm!' : `⚠️  ${fail} kiểm tra thất bại — cần xem lại`}${fail === 0 ? '                    ' : ''.padEnd(Math.max(0, 27-fail))}║`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');
}

run().catch(err => console.error('Lỗi:', err.message));
