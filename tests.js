const fs = require('fs');
const app = require('./lib/app');
const assert = require('assert');
const request = require('request');
const makeCss = require('./lib/makeCss');
const Notifier = require('./lib/Notifier');
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

    it('Should send and log bundle errors', (done) => {
      let b = makeBrowserify({
        entries: ['./fixture/error-index.js'],
      });
      app.set('browserify', b);
      app.set('notifier', new Notifier('array'));

      b.bundle((err, buff) => {

        appRequest('/_spawnit/bundle', (reqErr, res, body) => {
          assert(res.statusCode === 500);
          assert(body.message.includes(err.message));
          assert(app.get('notifier').notifications[0].message === err.message);
          done();
        });

      });

    });

    it.only('Should have a css endpoint', (done) => {
      const cssOpts = {
        file: './fixture/styles.scss',
      };
      app.set('css', () => { return makeCss(cssOpts); });

      appRequest('/_spawnit/css', (err, res, body) => {
        assert(body.includes('999px'));
        assert(body.includes('.foo.bar'));
        done();
      });
    });

    after('Close the http server', (done) => {
      server.close(done);
    });
  });


});