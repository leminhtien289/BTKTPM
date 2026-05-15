const http = require('http');
const LOGSTASH_URL = process.env.LOGSTASH_URL || null;
const SERVICE_NAME = process.env.SERVICE_NAME || 'unknown';
function log(level, message, meta = {}) {
  const entry = JSON.stringify({ '@timestamp': new Date().toISOString(), level, service: SERVICE_NAME, message, ...meta });
  console.log(entry);
  if (!LOGSTASH_URL) return;
  try {
    const url = new URL(LOGSTASH_URL);
    const buf = Buffer.from(entry);
    const req = http.request({ hostname: url.hostname, port: url.port || 80, path: url.pathname || '/', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': buf.length } });
    req.on('error', () => {}); req.write(buf); req.end();
  } catch {}
}
module.exports = { log };
