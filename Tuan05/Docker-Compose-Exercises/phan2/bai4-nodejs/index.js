const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({
    message: 'Hello from Node.js!',
    hostname: process.env.HOSTNAME || 'unknown'
  });
});

app.listen(3000, () => console.log('Server running on port 3000'));
