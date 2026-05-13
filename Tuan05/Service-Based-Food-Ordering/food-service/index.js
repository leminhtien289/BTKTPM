const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run("CREATE TABLE foods (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, price REAL, description TEXT, image TEXT)");
    
    // Seed data
    const stmt = db.prepare("INSERT INTO foods (name, price, description, image) VALUES (?, ?, ?, ?)");
    stmt.run('Cơm Tấm Sườn Bì', 45000, 'Cơm tấm đặc biệt', '🍱');
    stmt.run('Phở Bò', 50000, 'Phở bò tái nạm', '🍜');
    stmt.run('Bánh Mì Thịt Nướng', 25000, 'Bánh mì truyền thống', '🥖');
    stmt.run('Trà Sữa Trân Châu', 30000, 'Trà sữa truyền thống', '🧋');
    stmt.finalize();
});

app.get('/foods', (req, res) => {
    db.all("SELECT * FROM foods", [], (err, rows) => {
        res.json(rows);
    });
});

app.get('/foods/:id', (req, res) => {
    db.get("SELECT * FROM foods WHERE id = ?", [req.params.id], (err, row) => {
        if (!row) return res.status(404).json({ error: 'Food not found' });
        res.json(row);
    });
});

app.post('/foods', (req, res) => {
    const { name, price, description, image } = req.body;
    db.run("INSERT INTO foods (name, price, description, image) VALUES (?, ?, ?, ?)", 
        [name, price, description, image], function(err) {
        res.status(201).json({ id: this.lastID, name, price, description, image });
    });
});

app.put('/foods/:id', (req, res) => {
    const { name, price, description, image } = req.body;
    db.run("UPDATE foods SET name = ?, price = ?, description = ?, image = ? WHERE id = ?", 
        [name, price, description, image, req.params.id], function(err) {
        res.json({ id: req.params.id, name, price, description, image });
    });
});

app.delete('/foods/:id', (req, res) => {
    db.run("DELETE FROM foods WHERE id = ?", [req.params.id], function(err) {
        res.json({ success: true });
    });
});

const PORT = 8082;
app.listen(PORT, () => {
    console.log(`Food Service running on port ${PORT}`);
});
