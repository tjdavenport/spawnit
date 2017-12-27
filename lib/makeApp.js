const fs = require('fs');
const path = require('path');
const _ = require('underscore');
const { encode } = require('he');
const express = require('express');
const Logger = require('./Logger');
const remote = require('./remote');
const makeCss = require('./makeCss');
const readFile = require('./readFile');
const renderErr = require('./renderErr');
const bodyParser = require('body-parser');
const makeWatcher = require('./makeWatcher');
const Concat = require('concat-with-sourcemaps');
const makeBrowserify = require('./makeBrowserify');
const makeLinter = require('./makeLinter');

module.exports = function(opts) {
  const app = express();
  const logger = new Logger(opts.logDriver);
  const b =  makeBrowserify(opts.browserifyOpts);

  opts.misc(app);

  b.on('bytes', (bytes) => {
    logger.log(`New bundle generated at ${bytes} bytes`);
  });

  app.set('css', () => { return makeCss(opts.nodeSassOpts); });
  app.set('watcher', makeWatcher(opts.scssFiles));
  app.set('browserify', b);
  app.set('logger', logger);

  if (opts.esLintOpts && Object.keys(opts.esLintOpts).length > 0) {
    app.set('linter', makeLinter(opts.esLintOpts, logger));
  }

  app.use(bodyParser.json());
  app.disable('etag');

  app.use((req, res, next) => {
    logger.log(`${req.method} ${req.path}`);
    next();
  });

  _.each(opts.staticAssets, (asset) => {
    app.use(asset.route, express.static(asset.source));
  });

  app.get('/_spawnit/status', (req, res, next) => {
    res.json({
      message: 'it works!',
    });
  });

  app.get('/_spawnit/remote', (req, res, next) => {
    const protocol = (_.isObject(opts.ssl)) ? 'wss' : 'ws';
    const remoteScript = `
      var __spawnitRemote = ${remote.toString()};
      __spawnitRemote(${opts.wssPort}, '${protocol}');
    `;

    res.set('Content-Type', 'application/javascript').send(remoteScript);
  });

  app.get('/_spawnit/css', (req, res, next) => {
    let css = app.get('css');

    css().then((buf) => {
      res.set('Content-Type', 'text/css').send(buf);
    }).catch((err) => {
      logger.log(err.message);
      if (opts.errorNotify) {
        logger.log(err.message, 'desktop');
      }
      res.status(500).json(err);
    });

  });

  app.get('/_spawnit/scripts', (req, res, next) => {
    const reads = [];
    const basenames = [];

    try {
      opts.scripts.forEach((filename) => {
        reads.push(readFile(filename));
        basenames.push(path.basename(filename));
      });

      Promise.all(reads).then((values) => {
        const concat = new Concat(true, 'scripts.js', '\n');

        values.forEach((buff, index) => {
          concat.add(basenames[index], buff);
        });

        res.set('Content-Type', 'application/javascript');
        const map = new Buffer(concat.sourceMap, 'utf8').toString('base64');
        const mapComment = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${map}`;
        res.send(`${concat.content.toString()}${mapComment}`);
      });
    } catch (e) {
      res.status(500).json(err);
    }

  });

  app.get('/_spawnit/bundle', (req, res, next) => {
    const bundler = app.get('browserify');
    res.set('Content-Type', 'application/javascript');

    const readable = bundler.bundle((err, buff) => {
      if (err) {
        logger.log(err.toString());

        if (opts.errorNotify) {
          logger.log(err.toString(), 'desktop');
        } 

        const renderScript = `
          var __spawnitRenderErr = ${renderErr.toString()};
          __spawnitRenderErr(\`${encode(err.toString())}\`);
        `;

        res.send(renderScript);
      } else {
        res.send(buff.toString());
      }
    });

  });

  app.get('*', (req, res, next) => {
    res.send(app.get('html'));
  });

  return app;
};
