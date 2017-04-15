const app = require('./lib/app');
const assert = require('assert');
const request = require('request');
const commands = require('./lib/commands');

describe('spawnit', () => {

  describe('express server', () => {
    let server;
    let appRequest;

    before('Start the http server', (done) => {
      appRequest = request.defaults({
        baseUrl: 'http://localhost:1337',
        json: true,
      });
      server = app.listen(1337, done);
    });

    it('Should have a status endpoint', (done) => {
      appRequest('/status', (err, res, body) => {
        assert(res.statusCode === 200);
        assert(body.message === 'it works!');
        done();
      });
    });

    after('Close the http server', (done) => {
      server.close(done);
    });
  });


});
