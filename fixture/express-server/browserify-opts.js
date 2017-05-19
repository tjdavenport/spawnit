const watchify = require('watchify');

module.exports = {
  entries: ['./custom-index.js'],
  debug: true,
  cache: {}, 
  packageCache: {},
  plugins: [watchify],
};
