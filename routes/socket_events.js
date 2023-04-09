const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send('test');
});


// 웹소켓을 정의한 코드
const wss = require('../socket/websocket');

// 소켓 이벤트를 발생시키는 api입니다.
const WebSocket = require('ws');
router.get('/test_py', async (req, res) => {
    // Perform some asynchronous operation
    // const data = await fetchSomeData();
    const data = 'data';

    // Send the data back to the client
    res.json({ data });

    // Send a WebSocket message to all connected clients
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send('server send 웹캠 이미지 전달!');
        }
    });
});

module.exports = router;