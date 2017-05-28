const ws = require('ws');
const opn = require('opn');
const path = require('path');
const http = require('http');
const _ = require('underscore');
const Logger = require('./Logger');
const makeCss = require('./makeCss');
const getHtml = require('./getHtml');
const cleanup = require('./cleanup');
const bindWssEvents = require('./bindWssEvents');
const makeBrowserify = require('./makeBrowserify');

module.exports = {
  dev(passedOpts, done = () => {}) {
    const app = require('./app');
    const logger = new Logger('console');

    let userConfig = {};
    try {
      userConfig = require(path.join(process.cwd(), 'spawnit-config'));
    } catch (e) {  }

    const opts = _.defaults(_.extend(passedOpts, userConfig), {
      port: 1337,
      wssPort: 1338,
      browserifyOpts: {},
      nodeSassOpts: {},
    });
    app.set('opts', opts);

    app.set('browserify', makeBrowserify(opts.browserifyOpts));
    app.set('logger', logger);
    app.set('errorNotify', opts.errorNotify);
    app.set('css', () => { return makeCss(opts.nodeSassOpts); });

    app.get('browserify').on('bytes', (bytes) => {
      logger.log(`New bundle generated at ${bytes} bytes`);
    });

    const listen = new Promise((resolve, reject) => {
      cleanup.servers.push(app.listen(opts.port, () => {
        logger.log(`Listening on port ${opts.port}`);
        resolve();
      }));
    });

    const server = http.createServer(app);
    cleanup.servers.push(server);
    bindWssEvents(new ws.Server({ server: server }), app);
    const wssListen = new Promise((resolve, reject) => {
      server.listen(opts.wssPort, () => {
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

    cleanup.bind();
  },
};
