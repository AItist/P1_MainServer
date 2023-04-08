const express = require('express');
const router = express.Router();
const multer = require('multer')

router.get('/', (req, res) => {
    console.log('hello log')
    res.send('Hello, World!')
    // res.sendFile('./index.html');
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

router.post('/upload', upload.single('image'), (req, res) => {
    console.log(req.file);
    res.send('Image received');
});

module.exports = router;