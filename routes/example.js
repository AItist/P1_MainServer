const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('List of users');
});

router.get('/:id', (req, res) => {
  const userId = req.params.id;
  res.send(`Details for user ${userId}`);
});

module.exports = router;