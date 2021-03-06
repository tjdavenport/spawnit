const fs = require('fs');
const path = require('path');
const _ = require('underscore');
const express = require('express');
const Logger = require('./Logger');
const remote = require('./remote');
const makeCss = require('./makeCss');
const readFile = require('./readFile');
const makeLinter = require('./makeLinter');
const makeWatcher = require('./makeWatcher');
const makeBrowserify = require('./makeBrowserify');
const handleBundleReq = require('./handleBundleReq');

module.exports = function(opts) {
  const app = express();
  const logger = new Logger(opts.logDriver);
  const b =  makeBrowserify(opts.browserifyOpts);


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

  app.disable('etag');

  app.use((req, res, next) => {
    logger.log(`${req.method} ${req.path}`);
    next();
  });

  _.each(opts.staticAssets, (asset) => {
    app.use(asset.route, express.static(asset.source));
  });

  _.each(opts.scripts, (script) => {
    app.use('/_spawnit/script/' + path.basename(script), express.static(script));
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
      __spawnitRemote(${opts.wssPort}, '${protocol}', '${opts.domain}');
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

  app.get('/_spawnit/bundle', 
    (req, res, next) => {
      handleBundleReq(app.get('browserify'), res).once('error', err => {
        logger.log(err.toString());

        if (opts.errorNotify) {
          logger.log(err.toString(), 'desktop');
        } 
      });
    }
  );

  opts.misc(app);
  app.get('*', (req, res, next) => {
    res.send(app.get('html'));
  });

  return app;
};
