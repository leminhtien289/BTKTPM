const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json());

// In-memory SQLite for simplicity
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, role TEXT)");
    // Seed admin
    db.run("INSERT INTO users (username, password, role) VALUES ('admin', 'admin', 'ADMIN')");
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    db.run("INSERT INTO users (username, password, role) VALUES (?, ?, 'USER')", [username, password], function(err) {
        if (err) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(201).json({ id: this.lastID, username, role: 'USER' });
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT id, username, role FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (err || !row) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // In real app: generate JWT here
        res.json({ token: `fake-jwt-${row.id}`, user: row });
    });
});

app.get('/users', (req, res) => {
    db.all("SELECT id, username, role FROM users", [], (err, rows) => {
        res.json(rows);
    });
});

// For validate token from other services
app.post('/validate', (req, res) => {
    const { token } = req.body;
    if (token && token.startsWith('fake-jwt-')) {
        const id = token.replace('fake-jwt-', '');
        db.get("SELECT id, username, role FROM users WHERE id = ?", [id], (err, row) => {
             if(row) return res.json({ valid: true, user: row });
             return res.status(401).json({ valid: false });
        })
    } else {
        res.status(401).json({ valid: false });
    }
});


const PORT = 8081;
app.listen(PORT, () => {
    console.log(`User Service running on port ${PORT}`);
});
