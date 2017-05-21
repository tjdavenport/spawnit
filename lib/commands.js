const _ = require('underscore');
const makeCss = require('./makeCss');
const getHtml = require('./getHtml');
const Notifier = require('./Notifier');
const makeBrowserify = require('./makeBrowserify');

module.exports = {
  dev(passedOpts, done = () => {}) {
    const app = require('./app');
    const defaultOpts = {
      port: 1337,
      notifier: 'desktop',
    };
    const opts = _.defaults(passedOpts, defaultOpts);

    let browserifyOpts = {};
    try {
      browserifyOpts = require('./browserify-opts');
    } catch (e) {  }

    let cssOpts = {};
    try {
      cssOpts = require('./node-sass-opts');
    } catch (e) {  }

    app.set('browserify', makeBrowserify(browserifyOpts));
    app.set('notifier', new Notifier(opts.notifier));
    app.set('css', () => { return makeCss(cssOpts); });

    getHtml(process.cwd()).then((html) => {
      app.set('html', html);
      app.listen(opts.port, () => {
        done();
      });
    });
  },
};
