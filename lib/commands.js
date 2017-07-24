const ws = require('ws');
const opn = require('opn');
const path = require('path');
const _ = require('underscore');
const Logger = require('./Logger');
const makeCss = require('./makeCss');
const getHtml = require('./getHtml');
const cleanup = require('./cleanup');
const makeServer = require('./makeServer');
const makeWatcher = require('./makeWatcher');
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
      ssl: false,
      browserifyOpts: {},
      nodeSassOpts: {},
      errorNotify: false,
      scripts: [],
      noOpen: false,
      scssFiles: [
        path.join(process.cwd(), 'styles.scss'),
        path.join(process.cwd(), 'styles'),
      ],
    });
    app.set('opts', opts);

    const watcher = makeWatcher(opts.scssFiles);
    cleanup.setWatcher(watcher);

    app.set('watcher', watcher);
    app.set('browserify', makeBrowserify(opts.browserifyOpts));
    app.set('logger', logger);
    app.set('css', () => { return makeCss(opts.nodeSassOpts); });

    app.get('browserify').on('bytes', (bytes) => {
      logger.log(`New bundle generated at ${bytes} bytes`);
    });

    const server = makeServer(opts.ssl);
    const wsServer = makeServer(opts.ssl);
    bindWssEvents(new ws.Server({ server: wsServer }), app);

    cleanup.servers.push(server);
    cleanup.servers.push(wsServer);

    const listen = new Promise((resolve, reject) => {
      server.listen(opts.port, () => {
        logger.log(`Listening on port ${opts.port}`);
        resolve();
      });
    });
    const wssListen = new Promise((resolve, reject) => {
      wsServer.listen(opts.wssPort, () => {
        logger.log(`Web socket server listening on port ${opts.wssPort}`);
        resolve();
      });
    });

    Promise.all([getHtml(process.cwd()), listen, wssListen]).then((values) => {
      app.set('html', values[0]);
      if (!opts.noOpen) {
        const protocol = (_.isObject(opts.ssl)) ? 'https' : 'http';
        opn(`${protocol}://localhost:${opts.port}`);
      }
      done();
    });

    cleanup.bind();
  },
};
