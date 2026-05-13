const express = require('express');
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
