const express = require('express');
const app = express();
const usersRouter = require('./users');

app.use('/users', usersRouter);

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
