const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());

app.get('/status', (req, res, next) => {
  res.json({
    message: 'it works!',
  });
});

module.exports = app;
