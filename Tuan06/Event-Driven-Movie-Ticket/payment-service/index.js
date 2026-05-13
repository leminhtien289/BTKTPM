const { publishEvent, consumeEvent } = require('../rabbitmq');

console.log('[Payment Service] Starting...');

// Payment Service listen sự kiện BOOKING_CREATED
consumeEvent('movie_ticket_exchange', 'booking.created', 'payment_queue', (booking) => {
    console.log(`[Payment Service] Received booking request: #${booking.id} - Amount: ${booking.totalPrice}`);

    // Giả lập xử lý thanh toán (tỉ lệ thành công 80%)
    setTimeout(() => {
        const isSuccess = Math.random() > 0.2;
        
        const paymentResult = {
            orderId: booking.id,
            userId: booking.userId,
            amount: booking.totalPrice,
            status: isSuccess ? 'PAID' : 'FAILED',
            timestamp: new Date().toISOString()
        };

        const routingKey = isSuccess ? 'payment.completed' : 'payment.failed';
        
        // PUBLISH EVENT kết quả payment
        publishEvent('movie_ticket_exchange', routingKey, paymentResult);
        console.log(`[Payment Service] Processed booking #${booking.id} -> ${routingKey}`);

    }, 2000); // Giả lập delay 2s
});

// Chạy dummy server để PM2/Nodemon không bị thoát
const express = require('express');
const app = express();
app.listen(8084, () => console.log('[Payment Service] Mock server running on 8084'));
