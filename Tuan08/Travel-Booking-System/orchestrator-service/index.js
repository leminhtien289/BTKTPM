const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const USER_SERVICE = 'http://localhost:8081';
const TOUR_SERVICE = 'http://localhost:8082';
const BOOKING_SERVICE = 'http://localhost:8083';
const PAYMENT_SERVICE = 'http://localhost:8084';

// Chỉ cần forward GET /tours và POST /login cho frontend nếu cần, nhưng 
// theo đề bài, Frontend "Chỉ gọi API của Orchestrator". 
// Do đó Orchestrator phải cung cấp đủ API.
app.post('/auth/login', async (req, res) => {
  try {
    const response = await fetch(`${USER_SERVICE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    res.status(response.status).json(await response.json());
  } catch(e) { res.status(500).json({error: e.message}) }
});

app.get('/tours', async (req, res) => {
  try {
    const response = await fetch(`${TOUR_SERVICE}/tours`);
    res.json(await response.json());
  } catch(e) { res.status(500).json({error: e.message}) }
});

// CORE: Orchestration Flow
app.post('/book-tour', async (req, res) => {
  const { userId, tourId, quantity } = req.body;
  console.log(`[Orchestrator] Bắt đầu flow đặt tour cho User=${userId}, Tour=${tourId}`);

  try {
    // 1. Validate User
    console.log(`  1. Xác thực user...`);
    const userRes = await fetch(`${USER_SERVICE}/users/${userId}`);
    if (!userRes.ok) return res.status(400).json({ success: false, error: 'User validation failed' });
    const user = await userRes.json();

    // 2. Validate Tour & Get Price
    console.log(`  2. Lấy thông tin tour...`);
    const tourRes = await fetch(`${TOUR_SERVICE}/tours/${tourId}`);
    if (!tourRes.ok) return res.status(400).json({ success: false, error: 'Tour validation failed' });
    const tour = await tourRes.json();

    if (tour.available < quantity) {
      return res.status(400).json({ success: false, error: 'Không đủ chỗ trống' });
    }

    const totalAmount = tour.price * quantity;

    // 3. Create Booking
    console.log(`  3. Khởi tạo booking...`);
    const bookingRes = await fetch(`${BOOKING_SERVICE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, tourId, quantity, totalAmount })
    }).then(r => r.json());
    
    const bookingId = bookingRes.booking.id;

    // 4. Process Payment
    console.log(`  4. Gọi cổng thanh toán...`);
    const paymentRes = await fetch(`${PAYMENT_SERVICE}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, amount: totalAmount })
    });
    const payment = await paymentRes.json();

    if (!payment.success) {
      console.log(`  ❌ Thanh toán thất bại!`);
      // Trong thực tế sẽ gọi Booking Service để đổi trạng thái thành FAILED
      return res.status(400).json({ success: false, error: `Thanh toán lỗi: ${payment.error}` });
    }

    // 5. Tổng hợp và trả kết quả (Confirm)
    console.log(`  ✅ Đặt tour thành công! Gửi kết quả về Frontend.`);
    res.json({
      success: true,
      message: 'Đặt tour thành công!',
      booking: bookingRes.booking,
      transaction: payment.transactionId,
      user: user.name,
      tour: tour.name
    });

  } catch (error) {
    console.error(`[Orchestrator] Lỗi hệ thống:`, error.message);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống Orchestrator' });
  }
});

app.listen(8080, () => console.log('Orchestrator Service running on port 8080'));
