const http = require('http');

const env = process.env.APP_ENV || 'development';
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ environment: env, message: `Running in ${env} mode` }));
});

server.listen(port, () => {
  console.log(`App running in ${env} mode on port ${port}`);
});
