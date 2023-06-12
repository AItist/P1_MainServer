const WebSocket = require('ws');

const python_port = 8080;
const unity_om_port = 8081;
const unity_main_port = 8082;

const wss_python = new WebSocket.Server({ port: python_port });
const wss_unity_object_maker = new WebSocket.Server({ port: unity_om_port });
const wss_unity_main = new WebSocket.Server({ port: unity_main_port });

// 22 : AI 가공 웹소켓 연결시
wss_python.on('connection', (ws, req) => {

    const ip = req.headers;
    console.log('Python Websocket Client connected', ip['host']);

    // Send a welcome message to the client
    ws.send('Welcome to the ai WebSocket server! ', python_port);
    ws.on('message', (message) => {
        // 클라에서 데이터 전달받음
        // const _time = new Date();
        // console.log(`ai >> object-maker [${_time}]`);

        // 1. 받은 이미지를 바로 유니티와 연결된 웹소켓으로 전달한다.
        wss_unity_object_maker.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });
    ws.on('error', (error) => {
        console.error('error', error);
    });
    ws.on('close', () => {
        console.log('Python Websocket Client disconnected');
    });
});

// 33 : 객체 생성 Unity 웹소켓 연결시
wss_unity_object_maker.on('connection', (ws, req) => {

    const ip = req.headers;
    console.log('Unity Object-maker WebSocket client connected', ip['host']);

    // Send a welcome message to the client
    ws.send('Welcome to the WebSocket server! ', unity_om_port);
    ws.on('message', (message) => {
        // 클라에서 데이터 전달받음
        // const _time = new Date();
        // console.log(`object-maker >> main [${_time}]`);

        // TODO: 2차 메인 유니티 프로젝트로 전달
        // 1. 받은 이미지를 바로 유니티와 연결된 웹소켓으로 전달한다.
        wss_unity_main.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('error', (error) => {
        console.error('error', error);
    });
    ws.on('close', () => {
        console.log('Unity Object-maker Websocket Client disconnected ', ip['host']);
    });
});

// 메인 Unity 웹소켓 연결시
wss_unity_main.on('connection', (ws, req) => {

    const ip = req.headers;
    console.log('Unity Main WebSocket client connected', ip['host']);

    // Send a welcome message to the client
    ws.send('Welcome to the WebSocket server! ', unity_main_port);
    ws.on('message', (message) => {
        // 클라에서 데이터 전달받음
        console.log('message', message.toString());
    });

    ws.on('error', (error) => {
        console.error('error', error);
    });
    ws.on('close', () => {
        console.log('Unity Main Websocket Client disconnected ', ip['host']);
    });
});

module.exports = wss_python;