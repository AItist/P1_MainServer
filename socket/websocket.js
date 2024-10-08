const WebSocket = require('ws');
const axios = require('axios');

const p1_cam_port = 8060;
const p1_ai_port = 8070;
const p2_python_pose_merge_port = 8071;
const p3_unity_obj_maker_port = 8072;
const p4_python_img_merge_port = 8073;
const p5_unity_main_port = 8074;
const p6_unity_main2_port = 8075;

const wss0_cam = new WebSocket.Server({ port: p1_cam_port });
const wss1_ai = new WebSocket.Server({ port: p1_ai_port });
const wss2_python_pose_merge = new WebSocket.Server({ port: p2_python_pose_merge_port });
const wss3_unity_object_maker = new WebSocket.Server({ port: p3_unity_obj_maker_port });
const wss4_python_img_merge = new WebSocket.Server({ port: p4_python_img_merge_port });
const wss5_unity_main = new WebSocket.Server({ port: p5_unity_main_port });
const wss6_unity_main2 = new WebSocket.Server({ port: p6_unity_main2_port });

let packet = {};
let p3_packet = {};

let funcInterval = 1000

function periodicTask() {
    // console.log('This function runs every 1 seconds!');

    if (!packet.hasOwnProperty('indexes')) {
        // console.log('테스트 조건: indexes가 없습니다.');
        return;
    }

    // 웹소켓 연결
    if (packet['indexes'].length >= 1) {
        // console.log('테스트 조건: 1개 이상의 데이터가 모였습니다.');

        // 1. 받은 이미지를 바로 유니티와 연결된 웹소켓으로 전달한다.
        let packet_data = JSON.stringify(packet);
        // let packet_data = "Test packet data";
        const chunkSize = 1000; // 글자수 n 단위로 분할

        packet['indexes'].sort((a, b) => a - b);
        wss2_python_pose_merge.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                for (let i = 0; i < packet_data.length; i += chunkSize) {
                    const chunk = packet_data.slice(i, i + chunkSize);
                    client.send(JSON.stringify({ chunk: chunk, last: i + chunkSize >= packet_data.length }));
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
}

setInterval(periodicTask, funcInterval);

function socket_chunk_message(message, wss, hostIP) {
    // message: str;
    wss: WebSocket.Server;

    // let packet_data = JSON.stringify(packet);
    const chunkSize = 1000; // 글자수 n 단위로 분할

    // 1. 받은 이미지를 python image merge 웹소켓으로 전달한다.
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            // client.send(message);
            for (let i = 0; i < message.length; i += chunkSize) {
                const chunk = message.slice(i, i + chunkSize);
                client.send(JSON.stringify({ chunk: chunk, last: i + chunkSize >= message.length }));
            }
        }
        else if (client.readyState === WebSocket.CLOSED) {
            console.log(`${hostIP} client closed`);
        }
        else if (client.readyState === WebSocket.CLOSING) {
            console.log(`${hostIP} client closing`);
        }
    });
};

function socket_message(message, wss, hostIP) {
    // message: str;
    wss: WebSocket.Server;

    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message.toString());
        }
        else if (client.readyState === WebSocket.CLOSED) {
            console.log(`${hostIP} client closed`);
        }
        else if (client.readyState === WebSocket.CLOSING) {
            console.log(`${hostIP} client closing`);
        }
    });

};

// 22 : AI 가공 웹소켓 연결시
wss0_cam.on('connection', (ws, req) => {

    // const ip = req.headers;
    // console.log('Python Cam Client connected', ip['host']);
    const ip = req.socket.remoteAddress;
    // console.log(`Connected client IP: ${ip}`);

    // Send a welcome message to the client
    // ws.send('Welcome to the WebSocket server! ', p2_python_pose_merge_port);
    ws.on('message', (message) => {

        // socket_chunk_message(message, wss1_ai, ip['host']);
        socket_message(message, wss1_ai, ip['host']);

    });
    ws.on('error', (error) => {
        console.error('error', error);
    });
    ws.on('close', () => {
        console.log(`${ip} Python Websocket Client disconnected`);
    });
});

// 11 : webcam 이미지를 받는 웹소켓 연결시
wss1_ai.on('connection', (ws, req) => {

    const ip = req.headers;
    console.log('Cam AI WebSocket client connected', ip['host']);

    // // Send a welcome message to the client
    // ws.send('Welcome to the WebSocket server! ', p1_ai_port);
    ws.on('message', (message) => {

        // return;
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
        // console.log(keyList);

        if (packet.hasOwnProperty('indexes') && Array.isArray(packet['indexes'])) {
            // 배열에 0이 있으므로 추가하지 않음
            if (!packet['indexes'].includes(jsonData['index'])) {
                // 배열에 0이 없으므로 추가
                packet['indexes'].push(jsonData['index']);
            }
        } else {
            packet['indexes'] = [jsonData['index']];
        }
        // console.log(`${packet['indexes']}, ${packet['indexes'].length}`);
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

    // // Send a welcome message to the client
    // ws.send('Welcome to the ai WebSocket server! ', p2_python_pose_merge_port);
    ws.on('message', (message) => {
        // 클라에서 데이터 전달받음
        // const _time = new Date();
        // console.log(`ai >> object-maker [${_time}]`);

        socket_message(message, wss3_unity_object_maker, ip['host']);

        // // 1. 받은 이미지를 바로 유니티와 연결된 웹소켓으로 전달한다.
        // wss3_unity_object_maker.clients.forEach(function each(client) {
        //     if (client.readyState === WebSocket.OPEN) {
        //         client.send(message.toString());
        //     }
        // });
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

        socket_chunk_message(message, wss4_python_img_merge, ip['host']);
        
        // // let packet_data = JSON.stringify(packet);
        // const chunkSize = 1000; // 글자수 n 단위로 분할

        // // 1. 받은 이미지를 python image merge 웹소켓으로 전달한다.
        // wss4_python_img_merge.clients.forEach(function each(client) {
        //     if (client.readyState === WebSocket.OPEN) {
        //         // client.send(message);
        //         for (let i = 0; i < message.length; i += chunkSize) {
        //             const chunk = message.slice(i, i + chunkSize);
        //             client.send(JSON.stringify({ chunk: chunk, last: i + chunkSize >= message.length }));
        //         }
        //     }
        //     else if (client.readyState === WebSocket.CLOSED) {
        //         console.log('client closed');
        //     }
        //     else if (client.readyState === WebSocket.CLOSING) {
        //         console.log('client closing');
        //     }
        // });
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

    // // Send a welcome message to the client
    // ws.send('Welcome to the WebSocket server! ', p4_python_img_merge_port);
    ws.on('message', (message) => {

        socket_message(message, wss5_unity_main, ip['host']);

        // wss5_unity_main.clients.forEach(function each(client) {
        //     if (client.readyState === WebSocket.OPEN) {
        //         client.send(message);
        //     }
        // });
    });

    ws.on('error', (error) => {
        console.error('error', error);
    });

    ws.on('close', () => {
        console.log('python image merger WebSocket client disconnected ', ip['host']);
    });
});

// app.get('/init', async (req, res) => {
//     try {
//         // 다른 서버의 URL. 예를 들어, https://jsonplaceholder.typicode.com/todos/1
//         const targetUrl1 = 'http://192.168.50.20:3001/init';
//         // 해당 URL로 GET 요청을 보냅니다.
//         const response1 = await axios.get(targetUrl1);

//         // 다른 서버의 URL. 예를 들어, https://jsonplaceholder.typicode.com/todos/1
//         const targetUrl2 = 'http://192.168.50.30:3002/init';
//         // 해당 URL로 GET 요청을 보냅니다.
//         const response2 = await axios.get(targetUrl2);

//         // 다른 서버의 URL. 예를 들어, https://jsonplaceholder.typicode.com/todos/1
//         const targetUrl3 = 'http://192.168.50.40:3003/init';
//         // 해당 URL로 GET 요청을 보냅니다.
//         const response3 = await axios.get(targetUrl3);

//         // 다른 서버의 URL. 예를 들어, https://jsonplaceholder.typicode.com/todos/1
//         const targetUrl4 = 'http://192.168.50.50:3004/init';
//         // 해당 URL로 GET 요청을 보냅니다.
//         const response4 = await axios.get(targetUrl4);

//         // 응답을 클라이언트에 전달합니다.
//         // res.json(response.data);
//         res.sendStatus(200);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching data' });
//     }
// });

// 메인 Unity 웹소켓 연결시
wss5_unity_main.on('connection', (ws, req) => {
    const ip = req.headers;
    console.log('Unity Main WebSocket client connected', ip['host']);

    // // Send a welcome message to the client
    // ws.send('Welcome to the WebSocket server! ', p5_unity_main_port);
    ws.on('message', (message) => {
        // console.log('hello');

        socket_message(message, wss6_unity_main2, ip['host']);
        
        // wss6_unity_main2.clients.forEach(function each(client) {
        //     if (client.readyState === WebSocket.OPEN) {
        //         client.send(message);
        //     }
        // });
    });

    ws.on('error', (error) => {
        console.error('error', error);
    });
    ws.on('close', async (code, reason) => {
        // console.log(`Connection closed with code ${code} and reason ${reason}`);
        console.log('Unity Main Websocket Client disconnected ', ip['host']);
        try {
            // 여기에서 다른 서버에 요청을 보냅니다.
            const response = await axios.get('http://192.168.0.30:3002/start/12');
            // console.log('Response from other server:', response.data);
        } catch (error) {
            console.error('Error sending request to other server:', error.message);
        }
    });
    // ws.on('close', () => {
    //     console.log('Unity Main Websocket Client disconnected ', ip['host']);
    // });
});

// 메인2 Unity 웹소켓 연결시
wss6_unity_main2.on('connection', (ws, req) => {

    const ip = req.headers;
    console.log('Unity Main2 WebSocket client connected', ip['host']);

    // // Send a welcome message to the client
    // ws.send('Welcome to the WebSocket server! ', p5_unity_main_port);
    ws.on('message', (message) => {
        console.log('message', message.toString());
    });

    ws.on('error', (error) => {
        console.error('error', error);
    });
    ws.on('close', async (code, reason) => {
        // console.log(`Connection closed with code ${code} and reason ${reason}`);
        console.log('Unity Main Websocket Client disconnected ', ip['host']);
        try {
            // 여기에서 다른 서버에 요청을 보냅니다.
            const response = await axios.get('http://192.168.0.20:3001/start/15');
            // console.log('Response from other server:', response.data);
        } catch (error) {
            console.error('Error sending request to other server:', error.message);
        }
    });
    // ws.on('close', () => {
    //     console.log('Unity Main2 Websocket Client disconnected ', ip['host']);
    // });
});

module.exports = wss2_python_pose_merge;