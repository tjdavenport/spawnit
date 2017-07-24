const fs = require('fs');
const key = fs.readFileSync('./server.key');
const cert = fs.readFileSync('./server.crt');

module.exports = {
  ssl: { 
    key, 
    cert,
    passphrase: 'spawnit',
  },
};
