const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const services = {
  'user-service': {
    port: 8081,
    code: `const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const users = [
  { id: '1', username: 'demoUser', name: 'Nguyễn Văn A' }
];

app.post('/login', (req, res) => {
  const { username } = req.body;
  const user = users.find(u => u.username === username);
  if (user) res.json({ success: true, user });
  else res.status(401).json({ success: false, error: 'User not found' });
});

app.get('/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (user) res.json(user);
  else res.status(404).json({ error: 'User not found' });
});

app.listen(8081, () => console.log('User Service running on port 8081'));
`
  },
  'tour-service': {
    port: 8082,
    code: `const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const tours = [
  { id: 't1', name: 'Du lịch Đà Nẵng 3N2Đ', price: 3500000, image: '🏖️', available: 15 },
  { id: 't2', name: 'Khám phá Sapa 2N1Đ', price: 2000000, image: '⛰️', available: 5 },
  { id: 't3', name: 'Nha Trang Biển Gọi 4N3Đ', price: 5000000, image: '🌊', available: 20 }
];

app.get('/tours', (req, res) => res.json(tours));

app.get('/tours/:id', (req, res) => {
  const tour = tours.find(t => t.id === req.params.id);
  if (tour) res.json(tour);
  else res.status(404).json({ error: 'Tour not found' });
});

app.listen(8082, () => console.log('Tour Service running on port 8082'));
`
  },
  'booking-service': {
    port: 8083,
    code: `const express = require('express');
const cors = require('cors');
const { randomUUID } = require('crypto');
const app = express();
app.use(cors());
app.use(express.json());

const bookings = [];

app.post('/bookings', (req, res) => {
  const { userId, tourId, quantity, totalAmount } = req.body;
  const booking = {
    id: randomUUID(),
    userId,
    tourId,
    quantity,
    totalAmount,
    status: 'PENDING',
    createdAt: new Date()
  };
  bookings.push(booking);
  res.json({ success: true, booking });
});

app.listen(8083, () => console.log('Booking Service running on port 8083'));
`
  },
  'payment-service': {
    port: 8084,
    code: `const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

app.post('/payments', (req, res) => {
  const { bookingId, amount } = req.body;
  
  // Random giả lập thanh toán: 80% thành công
  const isSuccess = Math.random() < 0.8;
  
  if (isSuccess) {
    res.json({ success: true, transactionId: 'TXN' + Date.now(), message: 'Payment processed successfully' });
  } else {
    res.status(400).json({ success: false, error: 'Insufficient funds or bank error' });
  }
});

app.listen(8084, () => console.log('Payment Service running on port 8084'));
`
  },
  'orchestrator-service': {
    port: 8080,
    code: `const express = require('express');
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
    const response = await fetch(\`\${USER_SERVICE}/login\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    res.status(response.status).json(await response.json());
  } catch(e) { res.status(500).json({error: e.message}) }
});

app.get('/tours', async (req, res) => {
  try {
    const response = await fetch(\`\${TOUR_SERVICE}/tours\`);
    res.json(await response.json());
  } catch(e) { res.status(500).json({error: e.message}) }
});

// CORE: Orchestration Flow
app.post('/book-tour', async (req, res) => {
  const { userId, tourId, quantity } = req.body;
  console.log(\`[Orchestrator] Bắt đầu flow đặt tour cho User=\${userId}, Tour=\${tourId}\`);

  try {
    // 1. Validate User
    console.log(\`  1. Xác thực user...\`);
    const userRes = await fetch(\`\${USER_SERVICE}/users/\${userId}\`);
    if (!userRes.ok) return res.status(400).json({ success: false, error: 'User validation failed' });
    const user = await userRes.json();

    // 2. Validate Tour & Get Price
    console.log(\`  2. Lấy thông tin tour...\`);
    const tourRes = await fetch(\`\${TOUR_SERVICE}/tours/\${tourId}\`);
    if (!tourRes.ok) return res.status(400).json({ success: false, error: 'Tour validation failed' });
    const tour = await tourRes.json();

    if (tour.available < quantity) {
      return res.status(400).json({ success: false, error: 'Không đủ chỗ trống' });
    }

    const totalAmount = tour.price * quantity;

    // 3. Create Booking
    console.log(\`  3. Khởi tạo booking...\`);
    const bookingRes = await fetch(\`\${BOOKING_SERVICE}/bookings\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, tourId, quantity, totalAmount })
    }).then(r => r.json());
    
    const bookingId = bookingRes.booking.id;

    // 4. Process Payment
    console.log(\`  4. Gọi cổng thanh toán...\`);
    const paymentRes = await fetch(\`\${PAYMENT_SERVICE}/payments\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, amount: totalAmount })
    });
    const payment = await paymentRes.json();

    if (!payment.success) {
      console.log(\`  ❌ Thanh toán thất bại!\`);
      // Trong thực tế sẽ gọi Booking Service để đổi trạng thái thành FAILED
      return res.status(400).json({ success: false, error: \`Thanh toán lỗi: \${payment.error}\` });
    }

    // 5. Tổng hợp và trả kết quả (Confirm)
    console.log(\`  ✅ Đặt tour thành công! Gửi kết quả về Frontend.\`);
    res.json({
      success: true,
      message: 'Đặt tour thành công!',
      booking: bookingRes.booking,
      transaction: payment.transactionId,
      user: user.name,
      tour: tour.name
    });

  } catch (error) {
    console.error(\`[Orchestrator] Lỗi hệ thống:\`, error.message);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống Orchestrator' });
  }
});

app.listen(8080, () => console.log('Orchestrator Service running on port 8080'));
`
  }
};

const setupDir = path.join(__dirname, 'Travel-Booking-System');

for (const [folder, data] of Object.entries(services)) {
  const serviceDir = path.join(setupDir, folder);
  if (!fs.existsSync(serviceDir)) fs.mkdirSync(serviceDir, { recursive: true });
  
  fs.writeFileSync(path.join(serviceDir, 'index.js'), data.code);
  
  fs.writeFileSync(path.join(serviceDir, 'package.json'), JSON.stringify({
    name: folder,
    version: '1.0.0',
    main: 'index.js',
    dependencies: {
      express: '^4.21.1',
      cors: '^2.8.5'
    }
  }, null, 2));
}

// Generate start.js
const startJsCode = "const { spawn } = require('child_process');\n" +
"const path = require('path');\n\n" +
"const services = [\n" +
"  { name: 'User    ', dir: 'user-service', color: '\\x1b[32m' },\n" +
"  { name: 'Tour    ', dir: 'tour-service', color: '\\x1b[33m' },\n" +
"  { name: 'Booking ', dir: 'booking-service', color: '\\x1b[34m' },\n" +
"  { name: 'Payment ', dir: 'payment-service', color: '\\x1b[35m' },\n" +
"  { name: 'Orchestr', dir: 'orchestrator-service', color: '\\x1b[36m' },\n" +
"  { name: 'Frontend', dir: 'frontend', color: '\\x1b[31m', cmd: /^win/.test(process.platform) ? 'npm.cmd' : 'npm', args: ['run', 'dev'] }\n" +
"];\n\n" +
"console.log('\\x1b[1m🚀 Khởi động Travel Booking System (Orchestration SOA)\\x1b[0m\\n');\n\n" +
"services.forEach(({ name, dir, color, cmd, args }) => {\n" +
"  const processCmd = cmd || 'node';\n" +
"  const processArgs = args || ['index.js'];\n" +
"  \n" +
"  const proc = spawn(processCmd, processArgs, {\n" +
"    cwd: path.join(__dirname, dir),\n" +
"    shell: process.platform === 'win32',\n" +
"  });\n\n" +
"  proc.stdout.on('data', d => process.stdout.write(color + '[' + name + ']\\x1b[0m ' + d));\n" +
"  proc.stderr.on('data', d => process.stderr.write(color + '[' + name + ']\\x1b[31m ' + d + '\\x1b[0m'));\n" +
"  proc.on('close', code => console.log('\\x1b[31m[' + name + '] exited (code ' + code + ')\\x1b[0m'));\n" +
"});\n\n" +
"console.log('All services starting... Press Ctrl+C to stop.\\n');\n";

fs.writeFileSync(path.join(setupDir, 'start.js'), startJsCode);
console.log('Scaffold complete');
