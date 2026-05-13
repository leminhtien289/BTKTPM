const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(cors());

// Routes to User+Food Service (8081)
app.use('/api/users', createProxyMiddleware({ target: 'http://localhost:8081', changeOrigin: true }));
app.use('/api/foods', createProxyMiddleware({ target: 'http://localhost:8081', changeOrigin: true }));

// Routes to Order Service (8082)
app.use('/api/orders', createProxyMiddleware({ target: 'http://localhost:8082', changeOrigin: true }));

app.listen(8080, () => console.log('API Gateway running on port 8080'));
