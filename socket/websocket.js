const WebSocket = require('ws');

const p1_cam_ai_port = 8070;
const p2_python_pose_merge_port = 8071;
const p3_unity_obj_maker_port = 8072;
const p4_python_img_merge_port = 8073;
const p5_unity_main_port = 8074;

const wss1_cam_ai = new WebSocket.Server({ port: p1_cam_ai_port });
const wss2_python_pose_merge = new WebSocket.Server({ port: p2_python_pose_merge_port });
const wss3_unity_object_maker = new WebSocket.Server({ port: p3_unity_obj_maker_port });
const wss4_python_img_merge = new WebSocket.Server({ port: p4_python_img_merge_port });
const wss5_unity_main = new WebSocket.Server({ port: p5_unity_main_port });

let packet = {};
let p3_packet = {};

// 11 : webcam 이미지를 받는 웹소켓 연결시
wss1_cam_ai.on('connection', (ws, req) => {

    const ip = req.headers;
    console.log('Cam AI WebSocket client connected', ip['host']);

    // Send a welcome message to the client
    ws.send('Welcome to the WebSocket server! ', p1_cam_ai_port);
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
            wss2_python_pose_merge.clients.forEach(function each(client) {
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
wss2_python_pose_merge.on('connection', (ws, req) => {

    const ip = req.headers;
    console.log('Python Websocket Client connected', ip['host']);

    // Send a welcome message to the client
    ws.send('Welcome to the ai WebSocket server! ', p2_python_pose_merge_port);
    ws.on('message', (message) => {
        // 클라에서 데이터 전달받음
        // const _time = new Date();
        // console.log(`ai >> object-maker [${_time}]`);

        // 1. 받은 이미지를 바로 유니티와 연결된 웹소켓으로 전달한다.
        wss3_unity_object_maker.clients.forEach(function each(client) {
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
wss3_unity_object_maker.on('connection', (ws, req) => {

    const ip = req.headers;
    console.log('Unity Object-maker WebSocket client connected', ip['host']);

    // Send a welcome message to the client
    ws.send('Welcome to the WebSocket server! ', p3_unity_obj_maker_port);
    ws.on('message', (message) => {

        // let packet_data = JSON.stringify(packet);
        const chunkSize = 1000; // 글자수 n 단위로 분할

        // 1. 받은 이미지를 python image merge 웹소켓으로 전달한다.
        wss4_python_img_merge.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                // client.send(message);
                for (let i = 0; i < message.length; i += chunkSize) {
                    const chunk = message.slice(i, i + chunkSize);
                    client.send(JSON.stringify({chunk: chunk, last: i + chunkSize >= message.length}));
                }
            }
            else if (client.readyState === WebSocket.CLOSED) {
                console.log('client closed');
            }
            else if (client.readyState === WebSocket.CLOSING) {
                console.log('client closing');
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

// _4 : 이미지 병합 python 프로그램과 연결
wss4_python_img_merge.on('connection', (ws, req) => {

    const ip = req.headers;
    console.log('python image merger WebSocket client connected', ip['host']);

    // Send a welcome message to the client
    ws.send('Welcome to the WebSocket server! ', p4_python_img_merge_port);
    ws.on('message', (message) => {
        // 클라에서 데이터 전달받음
        // const _time = new Date();
        // console.log(`object-maker >> main [${_time}]`);

        // TODO: 2차 메인 유니티 프로젝트로 전달
        // 1. 받은 이미지를 바로 유니티와 연결된 웹소켓으로 전달한다.
        wss5_unity_main.clients.forEach(function each(client) {
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
wss5_unity_main.on('connection', (ws, req) => {

    const ip = req.headers;
    console.log('Unity Main WebSocket client connected', ip['host']);

    // Send a welcome message to the client
    ws.send('Welcome to the WebSocket server! ', p5_unity_main_port);
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

module.exports = wss2_python_pose_merge;