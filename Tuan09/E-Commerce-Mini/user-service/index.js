// USER SERVICE — Port 8081 — Own DB: users.db
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// Own DB — không share với service nào khác
const db = new Database('./users.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  )
`);

// Seed 1 demo user
const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('demoUser');
if (!existing) {
  db.prepare('INSERT INTO users (id, username, password, name, email) VALUES (?, ?, ?, ?, ?)')
    .run(randomUUID(), 'demoUser', bcrypt.hashSync('demo123', 8), 'Nguyễn Văn A', 'demo@email.com');
}

app.post('/register', (req, res) => {
  const { username, password, name, email } = req.body;
  if (!username || !password || !name) return res.status(400).json({ error: 'Thiếu thông tin' });
  try {
    const hashed = bcrypt.hashSync(password, 8);
    const id = randomUUID();
    db.prepare('INSERT INTO users (id, username, password, name, email) VALUES (?, ?, ?, ?, ?)').run(id, username, hashed, name, email || '');
    res.json({ success: true, user: { id, username, name } });
  } catch (e) {
    res.status(400).json({ error: 'Username đã tồn tại' });
  }
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
  }
  res.json({ success: true, user: { id: user.id, username: user.username, name: user.name } });
});

app.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, username, name, email, createdAt FROM users').all();
  res.json(users);
});

app.get('/users/:id', (req, res) => {
  const user = db.prepare('SELECT id, username, name, email FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.listen(8081, () => console.log('✅ User Service :8081 (DB: users.db)'));
