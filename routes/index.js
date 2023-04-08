const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
    res.render('index');
    // websocket event play
});

module.exports = router;