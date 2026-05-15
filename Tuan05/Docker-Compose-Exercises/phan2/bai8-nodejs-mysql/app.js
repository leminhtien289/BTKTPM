const express = require('express');
const mysql = require('mysql2/promise');

const app = express();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'mydb'
};

app.get('/', async (req, res) => {
  const conn = await mysql.createConnection(dbConfig);
  const [rows] = await conn.execute('SELECT NOW() AS time');
  await conn.end();
  res.json({ message: 'Connected to MySQL!', time: rows[0].time });
});

app.listen(3000, () => console.log('Server on port 3000'));
