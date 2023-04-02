// console.log('hello log')

const express = require('express')
const app = express();


const multer = require('multer')

app.get('/', (req, res) => {
    console.log('hello log')
    res.send('Hello, World!')
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('image'), (req, res) => {
    console.log(req.file);
    res.send('Image received');
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});