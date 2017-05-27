const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(express.static(path.join(process.cwd(), 'public')));

app.disable('etag');

app.use((req, res, next) => {
  const logger = app.get('logger');
  logger.log(`${req.method} ${req.path}`);
  next();
});

app.get('/_spawnit/status', (req, res, next) => {
  res.json({
    message: 'it works!',
  });
});

app.get('/_spawnit/css', (req, res, next) => {
  let css = app.get('css');

  css().then((buf) => {
    res.set('Content-Type', 'text/css').send(buf);
  }).catch((err) => {
    app.get('logger').log(err.message);
    if (app.get('errorNotify')) app.get('logger').log(err.message, 'desktop');
    res.status(500).json(err);
  });

});

app.get('/_spawnit/bundle', (req, res, next) => {
  let b = app.get('browserify');

  b.bundle((err, buf) => {

    if (err) {
      app.get('logger').log(err.message);
      if (app.get('errorNotify')) app.get('logger').log(err.message, 'desktop');
      res.status(500).json(err);
    } else {
      res.set('Content-Type', 'application/javascript').send(buf);
    }

  });

});

app.get('*', (req, res, next) => {
  res.send(app.get('html'));
});

module.exports = app;
