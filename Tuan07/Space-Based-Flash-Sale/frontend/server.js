const express = require('express');
const path = require('path');

const app = express();

// Trả config về cho browser — browser đọc IP các PU từ đây
app.get('/config.json', (req, res) => {
  res.json({
    PU1_URL: process.env.PU1_URL || 'http://localhost:8081',
    PU2_URL: process.env.PU2_URL || 'http://localhost:8082',
    PU3_URL: process.env.PU3_URL || 'http://localhost:8083',
    PU4_URL: process.env.PU4_URL || 'http://localhost:8084',
  });
});

app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(3000, () => console.log('Frontend :3000 — http://localhost:3000'));
