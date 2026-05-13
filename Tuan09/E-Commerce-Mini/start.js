const { spawn } = require('child_process');
const path = require('path');

const services = [
  { name: 'User    ', dir: 'user-service', color: '\x1b[32m' },
  { name: 'Product ', dir: 'product-service', color: '\x1b[33m' },
  { name: 'Cart    ', dir: 'cart-service', color: '\x1b[34m' },
  { name: 'Order   ', dir: 'order-service', color: '\x1b[35m' },
  { name: 'Payment ', dir: 'payment-service', color: '\x1b[36m' },
  { name: 'Frontend', dir: 'frontend', color: '\x1b[31m', cmd: /^win/.test(process.platform) ? 'npm.cmd' : 'npm', args: ['run', 'dev'] }
];

console.log('\x1b[1m🚀 Khởi động E-Commerce Mini (Microservices Architecture)\x1b[0m\n');

services.forEach(({ name, dir, color, cmd, args }) => {
  const processCmd = cmd || 'node';
  const processArgs = args || ['index.js'];
  
  const proc = spawn(processCmd, processArgs, {
    cwd: path.join(__dirname, dir),
    shell: process.platform === 'win32',
  });

  proc.stdout.on('data', d => process.stdout.write(color + '[' + name + ']\x1b[0m ' + d));
  proc.stderr.on('data', d => process.stderr.write(color + '[' + name + ']\x1b[31m ' + d + '\x1b[0m'));
  proc.on('close', code => console.log('\x1b[31m[' + name + '] exited (code ' + code + ')\x1b[0m'));
});

console.log('All services starting... Press Ctrl+C to stop.\n');
