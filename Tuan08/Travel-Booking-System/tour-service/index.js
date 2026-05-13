const express = require('express');
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
