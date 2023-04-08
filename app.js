const express = require('express')
const path = require('path');

const app = express();
app.set('port', 3000);


// const sampleRouter = require('./routes/example');
// const indexRouter = require('./routes');

// // app.use('/', mainRouter);
// app.use('/example', sampleRouter);
// // app.use('/websocket', wsRouter);
// app.use('/', indexRouter);

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
    console.log('WebSocket client connected');

    // Send a welcome message to the client
    ws.send('Welcome to the WebSocket server!');
});

app.get('/data', async (req, res) => {
    // Perform some asynchronous operation
    // const data = await fetchSomeData();
    const data = 'data';

    // Send the data back to the client
    res.json({ data });

    // Send a WebSocket message to all connected clients
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send('New data available!');
        }
    });
});

app.listen(app.get('port'), () => {
    console.log('Server started on port', app.get('port'));
});