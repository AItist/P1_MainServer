console.log('hello log')

const express = require('express')
const app = express()

app.get('/', (req, res) => {
    console.log('hello log')
    res.send('Hello, World!') 
});

app.listen(3000, () => {
    console.log('Server listening on port 3000')
})