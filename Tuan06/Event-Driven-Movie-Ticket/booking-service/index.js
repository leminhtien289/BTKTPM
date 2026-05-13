const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { publishEvent, consumeEvent } = require('../rabbitmq');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(':memory:');
db.serialize(() => {
    db.run("CREATE TABLE bookings (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER, movieId INTEGER, seats TEXT, totalPrice REAL, status TEXT)");
});

// ─── PROXY: /auth → User Service (8081) ─────────────────────────────────────
// Frontend chỉ gọi vào Booking Service, không biết User Service tồn tại
app.post('/auth/register', async (req, res) => {
    try {
        const response = await fetch('http://localhost:8081/register', {
            method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch(e) { res.status(503).json({ error: 'User service unavailable' }); }
});

app.post('/auth/login', async (req, res) => {
    try {
        const response = await fetch('http://localhost:8081/login', {
            method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch(e) { res.status(503).json({ error: 'User service unavailable' }); }
});

// ─── PROXY: /movies → Movie Service (8082) ──────────────────────────────────
app.get('/movies', async (req, res) => {
    try {
        const response = await fetch('http://localhost:8082/movies');
        const data = await response.json();
        res.json(data);
    } catch(e) { res.status(503).json({ error: 'Movie service unavailable' }); }
});

app.post('/movies', async (req, res) => {
    try {
        const response = await fetch('http://localhost:8082/movies', {
            method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch(e) { res.status(503).json({ error: 'Movie service unavailable' }); }
});

// ─── CORE: Bookings ──────────────────────────────────────────────────────────
app.post('/bookings', (req, res) => {
    const { userId, movieId, seats, totalPrice } = req.body;
    
    db.run("INSERT INTO bookings (userId, movieId, seats, totalPrice, status) VALUES (?, ?, ?, ?, 'PENDING')", 
    [userId, movieId, JSON.stringify(seats), totalPrice], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        const booking = { id: this.lastID, userId, movieId, seats, totalPrice, status: 'PENDING' };
        
        // PUBLISH EVENT → Payment Service sẽ consume
        publishEvent('movie_ticket_exchange', 'booking.created', booking);
        console.log(`[Booking Service] 📌 Booking #${booking.id} created → event published`);
        
        res.status(201).json(booking);
    });
});

app.get('/bookings/:userId', (req, res) => {
    db.all("SELECT * FROM bookings WHERE userId = ?", [req.params.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => ({ ...r, seats: JSON.parse(r.seats) })));
    });
});

// ─── CONSUME: Update booking status khi Payment event đến ──────────────────
consumeEvent('movie_ticket_exchange', 'payment.*', 'booking_update_queue', (content) => {
    console.log(`[Booking Service] 🔄 Update Booking #${content.orderId} → ${content.status}`);
    db.run("UPDATE bookings SET status = ? WHERE id = ?", [content.status, content.orderId]);
});

const PORT = 8083;
app.listen(PORT, () => {
    console.log(`[Booking Service] running on port ${PORT} (acting as single entry point)`);
});
