const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { publishEvent } = require('../rabbitmq');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(':memory:');
db.serialize(() => {
    db.run("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)");
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, password], function(err) {
        if (err) return res.status(400).json({ error: 'Username already exists' });
        
        const user = { id: this.lastID, username };
        // PUBLISH EVENT
        publishEvent('movie_ticket_exchange', 'user.registered', user);
        
        res.status(201).json(user);
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, user) => {
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        res.json({ token: `fake-jwt-${user.id}`, user: { id: user.id, username: user.username } });
    });
});

const PORT = 8081;
app.listen(PORT, () => {
    console.log(`[User Service] running on port ${PORT}`);
});
