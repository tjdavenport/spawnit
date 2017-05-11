const path = require('path');
const _ = require('underscore');
const watchify = require('watchify');
const browserify = require('browserify');

module.exports = function(passedOpts) {
  const defaultOpts = {
    entries: [(process.cwd() + path.sep + 'index.js')],
    debug: true,
    cache: {}, 
    packageCache: {},
    plugins: [watchify],
  };
  const opts = _.defaults(passedOpts, defaultOpts);

  return browserify(opts);
};
