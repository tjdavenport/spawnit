const path = require('path');
const _ = require('underscore');
const watchify = require('watchify');
const browserify = require('browserify');

module.exports = function(passedOpts) {
  const defaultOpts = {
    entries: ['./index.js'],
    debug: true,
    cache: {}, 
    packageCache: {},
    plugin: [watchify],
  };
  const opts = _.defaults(passedOpts, defaultOpts);

  return browserify(opts);
};
