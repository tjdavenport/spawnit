const fs = require('fs');
const path = require('path');

module.exports = {
  beforeStart() {
    return new Promise((resolve, reject) => {
      fs.writeFile('foo.txt', 'bar', 'utf8', () => {
        resolve();
      });
    });
  },
  beforeStop() {
    return new Promise((resolve, reject) => {
      fs.unlink('foo.txt', () => {
        resolve();
      });
    });
  },
};
