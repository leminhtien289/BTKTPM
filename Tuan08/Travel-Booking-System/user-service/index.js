const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const users = [
  { id: '1', username: 'demoUser', name: 'Nguyễn Văn A' }
];

app.post('/login', (req, res) => {
  const { username } = req.body;
  const user = users.find(u => u.username === username);
  if (user) res.json({ success: true, user });
  else res.status(401).json({ success: false, error: 'User not found' });
});

app.get('/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (user) res.json(user);
  else res.status(404).json({ error: 'User not found' });
});

app.listen(8081, () => console.log('User Service running on port 8081'));
