const aedes = require('aedes')();
const server = require('net').createServer(aedes.handle);
const port = 1883;

server.listen(port, () => {
  console.log('Message Broker (MQTT) started and listening on port ', port);
});

aedes.on('publish', function (packet, client) {
  if (client) {
    console.log('[Broker] Nhận Event:', packet.topic, '->', packet.payload.toString());
  }
});
