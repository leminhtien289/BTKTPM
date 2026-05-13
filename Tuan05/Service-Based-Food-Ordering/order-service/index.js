const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(':memory:');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:8081';
const FOOD_SERVICE_URL = process.env.FOOD_SERVICE_URL || 'http://localhost:8082';

db.serialize(() => {
    db.run("CREATE TABLE orders (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, total_price REAL, status TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
    db.run("CREATE TABLE order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER, food_id INTEGER, name TEXT, quantity INTEGER, price REAL)");
});

app.post('/orders', async (req, res) => {
    const { token, items } = req.body; // items: [{ foodId, quantity }]
    
    if (!token || !items || items.length === 0) {
        return res.status(400).json({ error: 'Token and items are required' });
    }

    try {
        // 1. Validate User
        const userRes = await axios.post(`${USER_SERVICE_URL}/validate`, { token });
        const user = userRes.data.user;

        // 2. Calculate total & validate foods
        let totalPrice = 0;
        const enrichedItems = [];
        
        for (const item of items) {
            const foodRes = await axios.get(`${FOOD_SERVICE_URL}/foods/${item.foodId}`);
            const food = foodRes.data;
            totalPrice += food.price * item.quantity;
            enrichedItems.push({
                foodId: food.id,
                name: food.name,
                quantity: item.quantity,
                price: food.price
            });
        }

        // 3. Create Order
        db.run("INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, 'PENDING')", 
            [user.id, totalPrice], function(err) {
            if (err) return res.status(500).json({ error: 'Failed to create order' });
            
            const orderId = this.lastID;
            
            // Insert Items
            const stmt = db.prepare("INSERT INTO order_items (order_id, food_id, name, quantity, price) VALUES (?, ?, ?, ?, ?)");
            enrichedItems.forEach(item => {
                stmt.run(orderId, item.foodId, item.name, item.quantity, item.price);
            });
            stmt.finalize();

            res.status(201).json({ 
                id: orderId, 
                userId: user.id, 
                totalPrice, 
                status: 'PENDING',
                items: enrichedItems 
            });
        });

    } catch (error) {
        console.error("Order error:", error.response ? error.response.data : error.message);
        res.status(400).json({ error: 'Failed to process order', details: error.message });
    }
});

app.get('/orders', (req, res) => {
    const token = req.headers.authorization;
    // Basic implementation - in real app validate token first
    db.all("SELECT * FROM orders", [], (err, rows) => {
        res.json(rows);
    });
});

app.put('/orders/:id/status', (req, res) => {
    const { status } = req.body;
    db.run("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id], function(err) {
        res.json({ id: req.params.id, status });
    });
});

const PORT = 8083;
app.listen(PORT, () => {
    console.log(`Order Service running on port ${PORT}`);
});
