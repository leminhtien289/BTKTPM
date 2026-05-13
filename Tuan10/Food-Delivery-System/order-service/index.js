const express = require('express');
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
