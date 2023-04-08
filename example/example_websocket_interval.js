const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
  // const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  // console.log('Client connected', ip);
  console.log('Client connected');


  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });
  ws.on('error', (error) => {
    console.error(error);
  });
  ws.on('close', () => {
    console.log('Client disconnected');
    clearInterval(ws.interval);
  });

  ws.interval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
        ws.send('서버에서 클라이언트로 메시지를 보냅니다.');
    }
  }, 3000);

});

server.listen(8080, function () {
  console.log('Server started on port 8080');
});
