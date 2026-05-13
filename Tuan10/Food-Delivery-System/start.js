const { spawn } = require('child_process');
const path = require('path');

const services = [
  { name: 'Broker  ', dir: 'message-broker', color: '\x1b[36m' },
  { name: 'Gateway ', dir: 'api-gateway', color: '\x1b[32m' },
  { name: 'UserFood', dir: 'user-food-service', color: '\x1b[33m' },
  { name: 'Order   ', dir: 'order-service', color: '\x1b[34m' },
  { name: 'Pay+Noti', dir: 'payment-notification-service', color: '\x1b[35m' },
  { name: 'Frontend', dir: 'frontend', color: '\x1b[31m', cmd: /^win/.test(process.platform) ? 'npm.cmd' : 'npm', args: ['run', 'dev'] }
];

console.log('\x1b[1m🚀 Khởi động Hybrid Architecture (Microservices + Event-Driven)\x1b[0m\n');

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
