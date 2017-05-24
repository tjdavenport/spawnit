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

    getHtml(process.cwd()).then((html) => {
      app.set('html', html);
      app.listen(opts.port, () => {
        app.get('logger').log(`Listening on port ${opts.port}`);
        if (opts.noOpen === undefined) {
          opn(`http://localhost:${opts.port}`);
        }
        done();
      });
    });
  },
};
