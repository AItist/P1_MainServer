const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });


// 웹소켓 연결 시
wss.on('connection', function connection(ws) {
    console.log('WebSocket client connected');

    // Send a welcome message to the client
    ws.send('Welcome to the WebSocket server!');
});

module.exports = wss;