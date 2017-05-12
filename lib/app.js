const express = require('express');
const makeCss = require('./makeCss');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

app.get('/_spawnit/status', (req, res, next) => {
  res.json({
    message: 'it works!',
  });
});

app.get('/_spawnit/css', (req, res, next) => {



});

app.get('/_spawnit/bundle', (req, res, next) => {
  let b = app.get('browserify');

  b.bundle((err, buf) => {

    if (err) {
      res.status(500).json(err);
    } else {
      res.send(buf);
    }

  });

});

module.exports = app;
