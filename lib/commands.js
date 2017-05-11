const _ = require('underscore');
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
      browserifyOpts = require('./browserify-opts');
    } catch (e) {  }

    app.set('browserify', makeBrowserify(browserifyOpts));

    app.listen(opts.port, () => {
      done();
    });
  },
};
