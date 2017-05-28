const fs = require('fs');
const path = require('path');
const express = require('express');
const remote = require('./remote');
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

app.get('/_spawnit/remote', (req, res, next) => {
  const wssPort = app.get('opts').wssPort;
  const remoteScript = `
    var __spawnitRemote = ${remote.toString()};
    __spawnitRemote(${wssPort});
  `;

  res.set('Content-Type', 'application/javascript').send(remoteScript);
});

app.get('/_spawnit/css', (req, res, next) => {
  let css = app.get('css');

  css().then((buf) => {
    res.set('Content-Type', 'text/css').send(buf);
  }).catch((err) => {
    app.get('logger').log(err.message);
    if (app.get('opts').errorNotify) app.get('logger').log(err.message, 'desktop');
    res.status(500).json(err);
  });

});

app.get('/_spawnit/bundle', (req, res, next) => {
  let b = app.get('browserify');

  const readable = b.bundle((err) => {
    if (err) {
      app.get('logger').log(err.message);
      if (app.get('opts').errorNotify) app.get('logger').log(err.message, 'desktop');
      res.status(500).json(err);
    } 
  });

  res.set('Content-Type', 'application/javascript');
  readable.pipe(res);

});

app.get('*', (req, res, next) => {
  res.send(app.get('html'));
});

module.exports = app;
