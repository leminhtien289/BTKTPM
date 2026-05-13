const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:8083';

app.post('/payments', async (req, res) => {
    const { orderId, method } = req.body; // method: 'COD' | 'BANKING'

    if (!orderId || !method) {
        return res.status(400).json({ error: 'orderId and method are required' });
    }

    try {
        // Mock payment processing time
        await new Promise(resolve => setTimeout(resolve, 500));

        // Randomly succeed or fail (80% success)
        const isSuccess = Math.random() > 0.2;

        if (isSuccess) {
            // Update order status
            await axios.put(`${ORDER_SERVICE_URL}/orders/${orderId}/status`, { status: 'PAID' });
            
            // Notification log
            console.log(`[NOTIFICATION] 🔔 Đơn hàng #${orderId} đã thanh toán thành công qua ${method}!`);
            
            res.json({ success: true, orderId, status: 'PAID', message: 'Payment successful' });
        } else {
             // Update order status
             await axios.put(`${ORDER_SERVICE_URL}/orders/${orderId}/status`, { status: 'FAILED' });
             
             // Notification log
             console.log(`[NOTIFICATION] ❌ Thanh toán cho đơn hàng #${orderId} THẤT BẠI!`);
             
             res.status(400).json({ success: false, orderId, status: 'FAILED', error: 'Payment declined by gateway' });
        }

    } catch (error) {
        console.error("Payment error:", error.message);
        res.status(500).json({ error: 'Payment service error' });
    }
});

const PORT = 8084;
app.listen(PORT, () => {
    console.log(`Payment + Notification Service running on port ${PORT}`);
});
