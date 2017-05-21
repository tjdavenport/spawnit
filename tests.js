const fs = require('fs');
const path = require('path');
const app = require('./lib/app');
const assert = require('assert');
const request = require('request');
const makeCss = require('./lib/makeCss');
const getHtml = require('./lib/getHtml');
const Notifier = require('./lib/Notifier');
const commands = require('./lib/commands');
const child_process = require('child_process');
const makeBrowserify = require('./lib/makeBrowserify');

describe('spawnit', () => {
  let appRequest = request.defaults({
    baseUrl: 'http://localhost:1337',
    json: true,
  });

  describe('express server', () => {
    let server;

    before('Start the http server', (done) => {
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
      const contents = fs.readFileSync('./fixture/express-server/index.js');

      app.set('browserify', makeBrowserify({
        entries: ['./fixture/express-server/index.js'],
      }));

      appRequest('/_spawnit/bundle', (err, res, body) => {
        assert(body.includes(contents));
        done();
      });
    });

    it('Should send and log bundle errors', (done) => {
      let b = makeBrowserify({
        entries: ['./fixture/express-server/error-index.js'],
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

    it('Should have a css endpoint', (done) => {
      const cssOpts = {
        file: './fixture/express-server/styles.scss',
      };
      app.set('css', () => { return makeCss(cssOpts); });

      appRequest('/_spawnit/css', (err, res, body) => {
        assert(body.includes('999px'));
        assert(body.includes('.foo.bar'));
        done();
      });
    });

    it('Should send and log sass errors', (done) => {
      const css = () => {
        return makeCss({
          file: './fixture/express-server/styles-error.scss',
        });
      };
      app.set('css', css);
      app.set('notifier', new Notifier('array'));

      css().catch((err) => {
        appRequest('/_spawnit/css', (reqErr, res, body) => {
          assert(res.statusCode === 500);
          assert(body.message.includes(err.message));
          assert(app.get('notifier').notifications[0].message === err.message);
          done();
        });
      });
    });

    it('Should catch all other requests and respond with html', (done) => {
      const html = '<html><head><title>spawnit</title></head><body></body></html>';
      app.set('html', html);
      appRequest('/foo/bar/baz', (err, res, body) => {
        assert(body === html);
        done();
      });
    });

    after('Close the http server', (done) => {
      server.close(done);
    });
  });

  describe('console application', () => {
    it('Should create a js development environment', (done) => {
      const cwd = path.join(process.cwd(), 'fixture', 'console-application');
      const spawnit = child_process.spawn('node', ['../../index.js'], {
        cwd: cwd,
      });

      spawnit.once('error', (err) => {
        throw err;
      });

      spawnit.stdout.once('data', (data) => {
        const html = getHtml(cwd);
        const servedHtml = new Promise((resolve, reject) => {
          appRequest('/foo/bar/baz', (err, res, body) => {
            if (err) {
              throw err;
            }
            resolve(body);
          })
        });
        const servedBundle = new Promise((resolve, reject) => {
          appRequest('/_spawnit/bundle', (err, res, body) => {
            if (err) {
              throw err;
            }
            resolve(body);
          });
        });
        const servedCss = new Promise((resolve, reject) => {
          appRequest('/_spawnit/css', (err, res, body) => {
            if (err) {
              throw err;
            }
            resolve(body);
          })
        });

        Promise.all([html, servedHtml, servedBundle, servedCss]).then((values) => {
          assert(values[0] === values[1]);
          assert(values[2].includes('alert(\'foo bar baz\');'));
          assert(values[3].includes('font-size: 999px;'));
          spawnit.kill();
          done();
        });
      });
    });
  });

});
