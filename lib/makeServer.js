const http = require('http');
const app = require('./app');
const https = require('https');
const _ = require('underscore');

module.exports = function(secure) {
  if (_.isObject(secure)) {
    return https.createServer(secure, app);
  } else {
    return http.createServer(app);
  }
};
