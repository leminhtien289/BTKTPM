const { consumeEvent } = require('../rabbitmq');

console.log('[Notification Service] Starting...');

// Listen User Registration
consumeEvent('movie_ticket_exchange', 'user.registered', 'notify_user_queue', (user) => {
    console.log(`[Notification Service] 📧 EMAIL SENT: Welcome to Movie Ticket, ${user.username}!`);
});

// Listen Payment Success
consumeEvent('movie_ticket_exchange', 'payment.completed', 'notify_success_queue', (payment) => {
    console.log(`[Notification Service] ✅ SMS SENT: Booking #${payment.orderId} thanh toán thành công! Vé đã được xác nhận.`);
});

// Listen Payment Failed
consumeEvent('movie_ticket_exchange', 'payment.failed', 'notify_fail_queue', (payment) => {
    console.log(`[Notification Service] ❌ SMS SENT: Thanh toán thất bại cho Booking #${payment.orderId}. Vui lòng thử lại.`);
});

// Chạy dummy server để Nodemon không thoát
const express = require('express');
const app = express();
app.listen(8085, () => console.log('[Notification Service] Mock server running on 8085'));
