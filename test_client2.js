const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', function open() {
  console.log('Connected to WebSocket server');
  ws.send('Hello from client!');
});

ws.on('message', function incoming(data) {
  console.log('received: %s', data);
});
