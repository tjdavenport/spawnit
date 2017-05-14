const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

app.get('/_spawnit/status', (req, res, next) => {
  res.json({
    message: 'it works!',
  });
});

app.get('/_spawnit/css', (req, res, next) => {
  let css = app.get('css');

  css().then((buf) => {
    res.send(buf);
  }).catch((err) => {
    app.get('notifier').notify(err);
    res.status(500).json(err);
  });

});

app.get('/_spawnit/bundle', (req, res, next) => {
  let b = app.get('browserify');

  b.bundle((err, buf) => {

    if (err) {
      app.get('notifier').notify(err);
      res.status(500).json(err);
    } else {
      res.send(buf);
    }

  });

});

module.exports = app;