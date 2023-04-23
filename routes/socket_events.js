const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();

router.get('/', (req, res) => {
    res.send('test');
});

// body-parser 설정
// body parser를 사용해 application/json 파싱 (기본 100kb -> 10mb 제한)
router.use(bodyParser.json({ limit: '10mb' }));
// body parser를 사용해 application/x-www-form-urlencoded 파싱 (기본 100kb -> 10mb 제한)
router.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

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

router.post('/data', async (req, res) => {
    const data = req.body;
    console.log(data); // { index: 0, ret: true, frame: [too large]}


    // // Send a WebSocket message to all connected clients
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
            // client.send(data);
        }
    });

    res.sendStatus(200);
});

module.exports = router;