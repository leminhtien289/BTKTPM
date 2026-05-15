const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const MONGO_URL = process.env.MONGO_URL || 'mongodb://root:root@localhost:27017';
let db;

MongoClient.connect(MONGO_URL)
  .then(client => {
    db = client.db('mydb');
    console.log('Connected to MongoDB');
  })
  .catch(err => { console.error(err); process.exit(1); });

app.get('/', async (req, res) => {
  await db.collection('visits').insertOne({ timestamp: new Date() });
  const count = await db.collection('visits').countDocuments();
  res.json({ message: 'Hello from Node.js + MongoDB!', totalVisits: count });
});

app.listen(3000, () => console.log('Server on port 3000'));
