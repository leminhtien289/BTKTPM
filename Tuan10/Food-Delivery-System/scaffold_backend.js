const fs = require('fs');
const path = require('path');

const services = {
  'api-gateway': {
    port: 8080,
    deps: { "express": "^4.21.1", "cors": "^2.8.5", "http-proxy-middleware": "^3.0.0" },
    code: `const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(cors());

// Routes to User+Food Service (8081)
app.use('/api/users', createProxyMiddleware({ target: 'http://localhost:8081', changeOrigin: true }));
app.use('/api/foods', createProxyMiddleware({ target: 'http://localhost:8081', changeOrigin: true }));

// Routes to Order Service (8082)
app.use('/api/orders', createProxyMiddleware({ target: 'http://localhost:8082', changeOrigin: true }));

app.listen(8080, () => console.log('API Gateway running on port 8080'));
`
  },
  'user-food-service': {
    port: 8081,
    deps: { "express": "^4.21.1", "cors": "^2.8.5" },
    code: `const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const users = [{ id: '1', username: 'demoUser', name: 'Nguyễn Văn A' }];
const foods = [
  { id: 'f1', name: 'Phở Bò', price: 50000, image: '🍜' },
  { id: 'f2', name: 'Bún Chả', price: 45000, image: '🍲' },
  { id: 'f3', name: 'Cơm Tấm', price: 40000, image: '🍛' }
];

app.post('/api/users/login', (req, res) => {
  const { username } = req.body;
  const user = users.find(u => u.username === username);
  if (user) res.json({ success: true, user });
  else res.status(401).json({ success: false, error: 'User not found' });
});

app.get('/api/foods', (req, res) => res.json(foods));

app.listen(8081, () => console.log('User+Food Service running on port 8081'));
`
  },
  'message-broker': {
    port: 1883,
    deps: { "aedes": "^0.51.0", "net": "^1.0.2" },
    code: `const aedes = require('aedes')();
const server = require('net').createServer(aedes.handle);
const port = 1883;

server.listen(port, () => {
  console.log('Message Broker (MQTT) started and listening on port ', port);
});

aedes.on('publish', function (packet, client) {
  if (client) {
    console.log('[Broker] Nhận Event:', packet.topic, '->', packet.payload.toString());
  }
});
`
  },
  'order-service': {
    port: 8082,
    deps: { "express": "^4.21.1", "cors": "^2.8.5", "mqtt": "^5.3.5" },
    code: `const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt');
const { randomUUID } = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const client = mqtt.connect('mqtt://localhost:1883');
const orders = []; // DB giả lập

app.post('/api/orders', (req, res) => {
  const { userId, foodId, price } = req.body;
  const order = { id: randomUUID(), userId, foodId, price, status: 'PENDING' };
  orders.push(order);
  
  // Trả kết quả ngay lập tức cho Frontend (REST - Synchronous)
  res.json({ success: true, order });

  // Phát Event chạy ngầm phía sau (Event-Driven - Asynchronous)
  client.publish('ORDER_CREATED', JSON.stringify(order));
  console.log('[Order Service] Đã xuất bản sự kiện: ORDER_CREATED', order.id);
});

app.get('/api/orders', (req, res) => res.json(orders));

app.post('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const order = orders.find(o => o.id === req.params.id);
  if (order) {
    order.status = status;
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.listen(8082, () => console.log('Order Service running on port 8082'));
`
  },
  'payment-notification-service': {
    port: 8083,
    deps: { "mqtt": "^5.3.5" },
    code: `const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
  client.subscribe('ORDER_CREATED');
  client.subscribe('PAYMENT_SUCCESS');
  client.subscribe('PAYMENT_FAILED');
  console.log('Payment+Notification Service running & listening to events...');
});

client.on('message', async (topic, message) => {
  const data = JSON.parse(message.toString());

  // === THÀNH PHẦN PAYMENT ===
  if (topic === 'ORDER_CREATED') {
    console.log('\\n[Payment Service] Nhận được order:', data.id, '- Đang xử lý thanh toán...');
    
    // Giả lập delay xử lý thanh toán 2 giây
    setTimeout(async () => {
      const isSuccess = Math.random() < 0.8; // 80% thành công
      const nextEvent = isSuccess ? 'PAYMENT_SUCCESS' : 'PAYMENT_FAILED';
      
      // Update DB của Order Service (qua REST hoặc Order Service tự bắt event)
      try {
        await fetch(\`http://localhost:8082/api/orders/\${data.id}/status\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: isSuccess ? 'PAID' : 'PAYMENT_FAILED' })
        });
      } catch (e) {}

      client.publish(nextEvent, JSON.stringify({ orderId: data.id, isSuccess }));
      console.log('[Payment Service] Phát sự kiện:', nextEvent);
    }, 2000);
  }

  // === THÀNH PHẦN NOTIFICATION ===
  if (topic === 'PAYMENT_SUCCESS') {
    console.log('[Notification Service] 🔔 TING TING! Đơn hàng', data.orderId, 'đã thanh toán thành công. Chuẩn bị giao hàng!');
  }
  
  if (topic === 'PAYMENT_FAILED') {
    console.log('[Notification Service] ❌ RẤT TIẾC! Đơn hàng', data.orderId, 'thanh toán thất bại.');
  }
});
`
  }
};

const setupDir = __dirname;

for (const [folder, data] of Object.entries(services)) {
  const serviceDir = path.join(setupDir, folder);
  if (!fs.existsSync(serviceDir)) fs.mkdirSync(serviceDir, { recursive: true });
  
  fs.writeFileSync(path.join(serviceDir, 'index.js'), data.code);
  
  fs.writeFileSync(path.join(serviceDir, 'package.json'), JSON.stringify({
    name: folder,
    version: '1.0.0',
    main: 'index.js',
    dependencies: data.deps
  }, null, 2));
}

const startJsCode = "const { spawn } = require('child_process');\n" +
"const path = require('path');\n\n" +
"const services = [\n" +
"  { name: 'Broker  ', dir: 'message-broker', color: '\\x1b[36m' },\n" +
"  { name: 'Gateway ', dir: 'api-gateway', color: '\\x1b[32m' },\n" +
"  { name: 'UserFood', dir: 'user-food-service', color: '\\x1b[33m' },\n" +
"  { name: 'Order   ', dir: 'order-service', color: '\\x1b[34m' },\n" +
"  { name: 'Pay+Noti', dir: 'payment-notification-service', color: '\\x1b[35m' },\n" +
"  { name: 'Frontend', dir: 'frontend', color: '\\x1b[31m', cmd: /^win/.test(process.platform) ? 'npm.cmd' : 'npm', args: ['run', 'dev'] }\n" +
"];\n\n" +
"console.log('\\x1b[1m🚀 Khởi động Hybrid Architecture (Microservices + Event-Driven)\\x1b[0m\\n');\n\n" +
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
