const ws = require('ws');
const opn = require('opn');
const path = require('path');
const _ = require('underscore');
const Logger = require('./Logger');
const makeApp = require('./makeApp');
const getHtml = require('./getHtml');
const cleanup = require('./cleanup');
const { static } = require('express');
const makeServer = require('./makeServer');
const bindWssEvents = require('./bindWssEvents');

module.exports = {
  dev(passedOpts, done = () => {}) {
    const logger = new Logger('console');

    let userConfig = {};
    try {
      userConfig = require(path.join(process.cwd(), 'spawnit-config'));
    } catch (e) {  }

    const opts = _.defaults(_.extend(passedOpts, userConfig), {
      port: 1337,
      wssPort: 1338,
      logDriver: 'console',
      ssl: false,
      browserifyOpts: {},
      misc: function() {},
      staticAssets: [],
      nodeSassOpts: {},
      errorNotify: false,
      scripts: [],
      domain: 'localhost',
      noOpen: false,
      scssFiles: [
        path.join(process.cwd(), 'styles.scss'),
        path.join(process.cwd(), 'styles'),
      ],
      esLintOpts: {},
    });
    const app = makeApp(opts);

    cleanup.setWatcher(app.get('watcher'));
    const server = makeServer(opts.ssl, app);
    const wsServer = makeServer(opts.ssl, app);
    bindWssEvents(new ws.Server({ server: wsServer }), app);

    cleanup.servers.push(server);
    cleanup.servers.push(wsServer);

    const listen = () => {
      return new Promise((resolve, reject) => {
        server.listen(opts.port, () => {
          logger.log(`Listening on port ${opts.port}`);
          resolve();
        });
      });
    }; 

    const wssListen = () => {
      new Promise((resolve, reject) => {
        wsServer.listen(opts.wssPort, () => {
          logger.log(`Web socket server listening on port ${opts.wssPort}`);
          resolve();
        });
      });
    };

    getHtml(process.cwd(), opts.scripts).then(html => {

      app.set('html', html);

      return Promise.all([listen(), wssListen()]).then(() => {
        if (!opts.noOpen) {
          const protocol = (_.isObject(opts.ssl)) ? 'https' : 'http';
          opn(`${protocol}://${opts.domain}:${opts.port}`);
        }

        done();
      }).catch(err => {
        process.exit(1);
      });
    });

    cleanup.bind();
  },
};
