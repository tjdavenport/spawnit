const http = require('http');
const https = require('https');
const _ = require('underscore');

module.exports = function(secure, app) {
  if (_.isObject(secure)) {
    return https.createServer(secure, app);
  } else {
    return http.createServer(app);
  }
};
