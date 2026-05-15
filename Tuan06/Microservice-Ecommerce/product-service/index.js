const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
app.use(express.json());

const dbPath = process.env.DB_PATH || path.join('/data', 'products.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    description TEXT,
    price       REAL    NOT NULL,
    stock       INTEGER NOT NULL DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const seed = db.prepare('SELECT COUNT(*) AS c FROM products').get();
if (seed.c === 0) {
  const ins = db.prepare('INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)');
  ins.run('Laptop Pro', 'High-performance laptop', 999.99, 50);
  ins.run('Wireless Mouse', 'Ergonomic wireless mouse', 29.99, 200);
  ins.run('Mechanical Keyboard', 'RGB mechanical keyboard', 79.99, 100);
  ins.run('Monitor 27"', '4K UHD monitor', 399.99, 30);
  console.log('Seeded 4 products');
}

app.get('/products', (req, res) => {
  res.json(db.prepare('SELECT * FROM products').all());
});

app.get('/products/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Product not found' });
  res.json(row);
});

app.post('/products', (req, res) => {
  const { name, description, price, stock } = req.body;
  if (!name || price == null) return res.status(400).json({ error: 'name and price required' });
  const r = db.prepare('INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)')
              .run(name, description ?? null, price, stock ?? 0);
  res.status(201).json(db.prepare('SELECT * FROM products WHERE id = ?').get(r.lastInsertRowid));
});

app.put('/products/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  const { name, description, price, stock } = req.body;
  db.prepare('UPDATE products SET name=?, description=?, price=?, stock=? WHERE id=?')
    .run(name ?? existing.name, description ?? existing.description, price ?? existing.price, stock ?? existing.stock, req.params.id);
  res.json(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id));
});

app.delete('/products/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ message: `Product ${req.params.id} deleted` });
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'product-service' }));

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => console.log(`Product Service on port ${PORT}`));
