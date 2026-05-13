const express = require('express');
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
