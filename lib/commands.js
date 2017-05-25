const opn = require('opn');
const path = require('path');
const _ = require('underscore');
const Logger = require('./Logger');
const makeCss = require('./makeCss');
const getHtml = require('./getHtml');
const makeBrowserify = require('./makeBrowserify');

module.exports = {
  dev(passedOpts, done = () => {}) {
    const app = require('./app');
    const defaultOpts = {
      port: 1337,
      wssPort: 1338,
    };
    const opts = _.defaults(passedOpts, defaultOpts);

    let browserifyOpts = {};
    try {
      browserifyOpts = require(path.join(process.cwd(), 'browserify-opts'));
    } catch (e) {  }

    let cssOpts = {};
    try {
      cssOpts = require(path.join(process.cwd(), 'node-sass-opts'));
    } catch (e) {  }

    app.set('browserify', makeBrowserify(browserifyOpts));
    app.set('logger', new Logger('console'));
    app.set('errorNotify', opts.errorNotify);
    app.set('css', () => { return makeCss(cssOpts); });

    const logger = app.get('logger');
    const listen = new Promise((resolve, reject) => {
      app.listen(opts.port, () => {
        logger.log(`Listening on port ${opts.port}`);
        resolve();
      });
    });
    const wssListen = new Promise((resolve, reject) => {
      app.get('server').listen(opts.wssPort, () => {
        logger.log(`Web socket server listening on port ${opts.wssPort}`);
        resolve();
      });
    });

    Promise.all([getHtml(process.cwd()), listen, wssListen]).then((values) => {
      app.set('html', values[0]);
      if (opts.noOpen === undefined) {
        opn(`http://localhost:${opts.port}`);
      }
      done();
    });
  },
};
