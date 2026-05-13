const express = require('express');
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
