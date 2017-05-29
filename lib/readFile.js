const fs = require('fs');
const _ = require('underscore');

module.exports = function(filename, options) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, _.defaults(options, {
      encoding: 'utf8'
    }), (err, data) => {
      if (err) reject(err);
      resolve(data);
    })
  });
}
