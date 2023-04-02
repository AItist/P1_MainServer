// console.log('hello log')

const express = require('express')
const app = express();

const mainRouter = require('./routes/main');
const sampleRouter = require('./routes/example');

app.use('/', mainRouter);
app.use('/example', sampleRouter);

app.listen(3000, () => {
    console.log('Server started on port 3000');
});