const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
app.use(express.json());

const dbPath = process.env.DB_PATH || path.join('/data', 'customers.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    phone      TEXT,
    address    TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const seed = db.prepare('SELECT COUNT(*) AS c FROM customers').get();
if (seed.c === 0) {
  const ins = db.prepare('INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)');
  ins.run('Alice Nguyen', 'alice@example.com', '0901234567', 'Hanoi');
  ins.run('Bob Tran',     'bob@example.com',   '0912345678', 'Ho Chi Minh City');
  ins.run('Carol Le',     'carol@example.com', '0923456789', 'Da Nang');
  console.log('Seeded 3 customers');
}

app.get('/customers', (req, res) => {
  res.json(db.prepare('SELECT * FROM customers').all());
});

app.get('/customers/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Customer not found' });
  res.json(row);
});

app.post('/customers', (req, res) => {
  const { name, email, phone, address } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'name and email required' });
  try {
    const r = db.prepare('INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)')
                .run(name, email, phone ?? null, address ?? null);
    res.status(201).json(db.prepare('SELECT * FROM customers WHERE id = ?').get(r.lastInsertRowid));
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already exists' });
    throw e;
  }
});

app.put('/customers/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Customer not found' });
  const { name, email, phone, address } = req.body;
  db.prepare('UPDATE customers SET name=?, email=?, phone=?, address=? WHERE id=?')
    .run(name ?? existing.name, email ?? existing.email, phone ?? existing.phone, address ?? existing.address, req.params.id);
  res.json(db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id));
});

app.delete('/customers/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Customer not found' });
  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.json({ message: `Customer ${req.params.id} deleted` });
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'customer-service' }));

const PORT = process.env.PORT || 8082;
app.listen(PORT, () => console.log(`Customer Service on port ${PORT}`));
