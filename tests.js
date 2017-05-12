const fs = require('fs');
const vm = require('vm');
const app = require('./lib/app');
const assert = require('assert');
const request = require('request');
const commands = require('./lib/commands');
const makeBrowserify = require('./lib/makeBrowserify');

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
      appRequest('/_spawnit/status', (err, res, body) => {
        assert(res.statusCode === 200);
        assert(body.message === 'it works!');
        done();
      });
    });

    it('Should have a bundle endpoint', (done) => {
      const contents = fs.readFileSync('./fixture/index.js');

      app.set('browserify', makeBrowserify({
        entries: ['./fixture/index.js'],
      }));

      appRequest('/_spawnit/bundle', (err, res, body) => {
        assert(body.includes(contents));
        done();
      });
    });

    it('Should send bundle errors', (done) => {
      let b = makeBrowserify({
        entries: ['./fixture/error-index.js'],
      });
      app.set('browserify', b);

      b.bundle((err, buff) => {

        appRequest('/_spawnit/bundle', (reqErr, res, body) => {
          assert(res.statusCode === 500);
          assert(body.message.includes(err.message));
          done();
        });

      });

    });

    after('Close the http server', (done) => {
      server.close(done);
    });
  });


});
