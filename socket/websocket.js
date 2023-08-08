const WebSocket = require('ws');

const cam_ai_port = 8070;
const python_port = 8080;
const unity_om_port = 8081;
const unity_main_port = 8082;

const wss_cam_ai = new WebSocket.Server({ port: cam_ai_port });
const wss_python = new WebSocket.Server({ port: python_port });
const wss_unity_object_maker = new WebSocket.Server({ port: unity_om_port });
const wss_unity_main = new WebSocket.Server({ port: unity_main_port });

let packet = {};

// 11 : webcam 이미지를 받는 웹소켓 연결시
wss_cam_ai.on('connection', (ws, req) => {

    const ip = req.headers;
    console.log('Cam AI WebSocket client connected', ip['host']);

    // Send a welcome message to the client
    ws.send('Welcome to the WebSocket server! ', cam_ai_port);
    ws.on('message', (message) => {
        // 클라에서 데이터 전달받음
        // const _time = new Date();
        // console.log(`cam_ai >> python [${_time}]`);

        // console.log('message', message.toString())
        // console.log('wss_cam_ai message on');

        let jsonData = JSON.parse(message.toString());
        // console.log(jsonData['index']);
        // console.log()

        let poseKey = 'pose' + jsonData['index'];
        let segKey = 'seg' + jsonData['index'];
        let pCenterKey = 'pCenter' + jsonData['index'];
        packet[poseKey] = jsonData['pose'];
        packet[segKey] = jsonData['seg'];
        packet[pCenterKey] = jsonData['pose_center'];

        // 키 리스트 확인
        let keyList = Object.keys(packet);
        console.log(keyList);

        if (packet.hasOwnProperty('indexes') && Array.isArray(packet['indexes'])) {
            // 배열에 0이 있으므로 추가하지 않음
            if (!packet['indexes'].includes(jsonData['index'])) {
                // 배열에 0이 없으므로 추가
                packet['indexes'].push(jsonData['index']);
            }
        } else {
            packet['indexes'] = [jsonData['index']];
        }
        console.log(`${packet['indexes']}, ${packet['indexes'].length}`);

        // 웹소켓 연결
        if (packet['indexes'].length >= 1) {
            console.log('테스트 조건: 2개 이상의 데이터가 모였습니다.');

            // 1. 받은 이미지를 바로 유니티와 연결된 웹소켓으로 전달한다.
            let packet_data = JSON.stringify(packet);
            // let packet_data = "Test packet data";
            const chunkSize = 1000; // 글자수 n 단위로 분할

            packet['indexes'].sort((a, b) => a - b);
            wss_python.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                    for (let i = 0; i < packet_data.length; i += chunkSize) {
                        const chunk = packet_data.slice(i, i + chunkSize);
                        client.send(JSON.stringify({chunk: chunk, last: i + chunkSize >= packet_data.length}));
                    }
                    // client.send(packet_data);
                }
                else if (client.readyState === WebSocket.CLOSED) {
                    console.log('client closed');
                }
                else if (client.readyState === WebSocket.CLOSING) {
                    console.log('client closing');
                }
            });

            packet = {};
        }

        // // 1. 받은 이미지를 바로 유니티와 연결된 웹소켓으로 전달한다.
        // wss_python.clients.forEach(function each(client) {
        //     if (client.readyState === WebSocket.OPEN) {
        //         client.send(message.toString());
        //     }
        // });
    });

    ws.on('error', (error) => {
        console.error('error', error);
    });
    ws.on('close', () => {
        console.log('Cam AI Websocket Client disconnected ', ip['host']);
    });
});


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