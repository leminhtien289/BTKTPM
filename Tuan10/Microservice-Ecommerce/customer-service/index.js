const express  = require('express');
const Database = require('better-sqlite3');
const path     = require('path');
const { log }  = require('./logger');

const app = express();
app.use(express.json());

const db = new Database(process.env.DB_PATH || path.join('/data', 'customers.db'));
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

if (db.prepare('SELECT COUNT(*) AS c FROM customers').get().c === 0) {
  const ins = db.prepare('INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)');
  ins.run('Alice Nguyen', 'alice@example.com', '0901234567', 'Hanoi');
  ins.run('Bob Tran',     'bob@example.com',   '0912345678', 'Ho Chi Minh City');
  ins.run('Carol Le',     'carol@example.com', '0923456789', 'Da Nang');
  log('info', 'Seeded 3 customers');
}

app.get('/customers', (req, res) => {
  const rows = db.prepare('SELECT * FROM customers').all();
  log('info', 'GET /customers', { count: rows.length });
  res.json(rows);
});

app.get('/customers/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!row) { log('warn', 'Customer not found', { id: req.params.id }); return res.status(404).json({ error: 'Customer not found' }); }
  res.json(row);
});

app.post('/customers', (req, res) => {
  const { name, email, phone, address } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'name and email required' });
  try {
    const r = db.prepare('INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)').run(name, email, phone ?? null, address ?? null);
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(r.lastInsertRowid);
    log('info', 'Customer created', { id: customer.id, email: customer.email });
    res.status(201).json(customer);
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already exists' });
    throw e;
  }
});

app.put('/customers/:id', (req, res) => {
  const e = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!e) return res.status(404).json({ error: 'Customer not found' });
  const { name, email, phone, address } = req.body;
  db.prepare('UPDATE customers SET name=?, email=?, phone=?, address=? WHERE id=?')
    .run(name ?? e.name, email ?? e.email, phone ?? e.phone, address ?? e.address, req.params.id);
  log('info', 'Customer updated', { id: req.params.id });
  res.json(db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id));
});

app.delete('/customers/:id', (req, res) => {
  if (!db.prepare('SELECT id FROM customers WHERE id = ?').get(req.params.id))
    return res.status(404).json({ error: 'Customer not found' });
  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  log('info', 'Customer deleted', { id: req.params.id });
  res.json({ message: `Customer ${req.params.id} deleted` });
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'customer-service' }));

const PORT = process.env.PORT || 8082;
app.listen(PORT, () => log('info', 'Customer Service started', { port: PORT }));
