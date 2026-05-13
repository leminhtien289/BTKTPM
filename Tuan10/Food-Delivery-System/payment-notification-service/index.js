const mqtt = require('mqtt');
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
    console.log('\n[Payment Service] Nhận được order:', data.id, '- Đang xử lý thanh toán...');
    
    // Giả lập delay xử lý thanh toán 2 giây
    setTimeout(async () => {
      const isSuccess = Math.random() < 0.8; // 80% thành công
      const nextEvent = isSuccess ? 'PAYMENT_SUCCESS' : 'PAYMENT_FAILED';
      
      // Update DB của Order Service (qua REST hoặc Order Service tự bắt event)
      try {
        await fetch(`http://localhost:8082/api/orders/${data.id}/status`, {
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
