const { spawn } = require('child_process');
const path = require('path');

const services = [
  { name: 'PU1-Product  ', dir: 'pu1-product',  file: 'index.js',  color: '\x1b[32m' },
  { name: 'PU2-Cart     ', dir: 'pu2-cart',      file: 'index.js',  color: '\x1b[33m' },
  { name: 'PU3-Order    ', dir: 'pu3-order',     file: 'index.js',  color: '\x1b[35m' },
  { name: 'PU4-Inventory', dir: 'pu4-inventory', file: 'index.js',  color: '\x1b[36m' },
  { name: 'Frontend     ', dir: 'frontend',      file: 'server.js', color: '\x1b[34m' },
];

console.log('\x1b[1m🚀 Flash Sale — Space-Based Architecture\x1b[0m');
console.log('Make sure Redis is running on localhost:6379\n');

services.forEach(({ name, dir, file, color }) => {
  const proc = spawn('node', [file], {
    cwd: path.join(__dirname, dir),
    shell: process.platform === 'win32',
  });

  proc.stdout.on('data', d => process.stdout.write(`${color}[${name}]\x1b[0m ${d}`));
  proc.stderr.on('data', d => process.stderr.write(`${color}[${name}]\x1b[31m ${d}\x1b[0m`));
  proc.on('close', code => console.log(`\x1b[31m[${name}] exited (code ${code})\x1b[0m`));
});

console.log('All services starting... Press Ctrl+C to stop.\n');
