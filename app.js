const express = require('express')
const path = require('path');

const app = express();
app.set('port', 3000);


// 웹소켓을 정의한 코드
// const socket = require('./socket/ws_python');

// 소켓 관련 이벤트를 발생시키는 라우터
const socket_events = require('./routes/socket_events');
app.use('/ws', socket_events);

// [x] : 외부에서 이미지를 받게 된다. socket_events /test_py 에 관련코드
// [x] : socket_events /test_py 에서 받은 이미지를 바로 웹소켓으로 보낸다. 
//      socket_events /test_py 안에 socket/ws_python 웹소켓 코드 참조함
// [x] : socket/ws_python 에서 정의된 웹소켓에 연결된 클라이언트에 이미지를 뿌린다.

// [ ] : socket/ws_python 웹소켓으로 연결된 python ai processor에서 이미지를 다시 서버로 준다.
// [ ] : 받은 이미지를 바로 유니티와 연결된 웹소켓으로 전달한다.

app.get('/', (req, res) => {
    res.send('Hello, Express');
});

app.get('/exec', (req, res) => {
    const exec = require('child_process').exec;
    exec('D:\\hello.bat', function(error, stdout, stderr) {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        // console.log(stdout);
        // res.send(stdout);
    });
});

app.listen(app.get('port'), () => {
    console.log('Server started on port', app.get('port'));
});