const express  = require('express');
const Database = require('better-sqlite3');
const path     = require('path');
const { log }  = require('./logger');

const app = express();
app.use(express.json());

const db = new Database(process.env.DB_PATH || path.join('/data', 'products.db'));
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

if (db.prepare('SELECT COUNT(*) AS c FROM products').get().c === 0) {
  const ins = db.prepare('INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)');
  ins.run('Laptop Pro',          'High-performance laptop',  999.99, 50);
  ins.run('Wireless Mouse',      'Ergonomic wireless mouse',  29.99, 200);
  ins.run('Mechanical Keyboard', 'RGB mechanical keyboard',   79.99, 100);
  ins.run('Monitor 27"',         '4K UHD monitor',           399.99, 30);
  log('info', 'Seeded 4 products');
}

app.get('/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products').all();
  log('info', 'GET /products', { count: products.length });
  res.json(products);
});

app.get('/products/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) { log('warn', 'Product not found', { id: req.params.id }); return res.status(404).json({ error: 'Product not found' }); }
  res.json(row);
});

app.post('/products', (req, res) => {
  const { name, description, price, stock } = req.body;
  if (!name || price == null) return res.status(400).json({ error: 'name and price required' });
  const r = db.prepare('INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)')
              .run(name, description ?? null, price, stock ?? 0);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(r.lastInsertRowid);
  log('info', 'Product created', { id: product.id, name: product.name });
  res.status(201).json(product);
});

app.put('/products/:id', (req, res) => {
  const e = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!e) return res.status(404).json({ error: 'Product not found' });
  const { name, description, price, stock } = req.body;
  db.prepare('UPDATE products SET name=?, description=?, price=?, stock=? WHERE id=?')
    .run(name ?? e.name, description ?? e.description, price ?? e.price, stock ?? e.stock, req.params.id);
  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  log('info', 'Product updated', { id: updated.id });
  res.json(updated);
});

app.delete('/products/:id', (req, res) => {
  if (!db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id))
    return res.status(404).json({ error: 'Product not found' });
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  log('info', 'Product deleted', { id: req.params.id });
  res.json({ message: `Product ${req.params.id} deleted` });
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'product-service' }));

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => log('info', `Product Service started`, { port: PORT }));
