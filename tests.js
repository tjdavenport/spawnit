const fs = require('fs');
const path = require('path');
const app = require('./lib/app');
const assert = require('assert');
const request = require('request');
const Logger = require('./lib/Logger');
const makeCss = require('./lib/makeCss');
const getHtml = require('./lib/getHtml');
const commands = require('./lib/commands');
const Client = require('websocket').client;
const child_process = require('child_process');
const makeBrowserify = require('./lib/makeBrowserify');

describe('spawnit', () => {
  let appRequest = request.defaults({
    baseUrl: 'http://localhost:1337',
    json: true,
  });

  describe.only('express server', () => {
    let server;

    before('Start the http server', (done) => {
      app.set('logger', new Logger('array'));
      server = app.listen(1337, done);
    });

    it('Should have a status endpoint', (done) => {
      appRequest('/_spawnit/status', (err, res, body) => {
        assert(res.statusCode === 200);
        assert(body.message === 'it works!');
        done();
      });
    });

    it.only('Should have a remote script endpoint', (done) => {
      appRequest('/_spawnit/remote', (err, res, body) => {
        console.log(body);
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
      app.set('logger', new Logger('array'));

      b.bundle((err, buff) => {

        appRequest('/_spawnit/bundle', (reqErr, res, body) => {
          assert(res.statusCode === 500);
          assert(body.message.includes(err.message));
          assert(app.get('logger').logs.includes(err.message));
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
      app.set('logger', new Logger('array'));

      css().catch((err) => {
        appRequest('/_spawnit/css', (reqErr, res, body) => {
          assert(res.statusCode === 500);
          assert(body.message.includes(err.message));
          assert(app.get('logger').logs.includes(err.message));
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
    function fixture() {
      return path.join(...[process.cwd(), 'fixture', 'console-application'].concat(Array.from(arguments)));
    }

    function makeSpawnit() { // can only call this once for some reason, otherwise we hit timeout. Possible Node bug?
      const spawnit = child_process.spawn('node', [path.join(process.cwd(), 'index.js'), '-n'], {
        cwd: fixture.apply(null, Array.from(arguments)),
      });

      spawnit.once('error', (err) => {
        throw err;
      });

      return spawnit;
    }

    it('Should create a js development environment', (done) => {
      const spawnit = makeSpawnit();

      spawnit.stdout.once('data', (data) => {
        const html = getHtml(process.cwd());
        const servedHtml = new Promise((resolve, reject) => {
          appRequest('/foo/bar/baz', (err, res, body) => {
            if (err) throw err;
            resolve(body);
          })
        });
        const servedBundle = new Promise((resolve, reject) => {
          appRequest('/_spawnit/bundle', (err, res, body) => {
            if (err) throw err;
            resolve(body);
          });
        });
        const servedCss = new Promise((resolve, reject) => {
          appRequest('/_spawnit/css', (err, res, body) => {
            if (err) throw err;
            resolve(body);
          })
        });

        Promise.all([html, servedHtml, servedBundle, servedCss]).then((values) => {
          spawnit.kill();
          assert(values[0] === values[1]);
          assert(values[2].includes('alert(\'foo bar baz\');'));
          assert(values[3].includes('font-size: 999px;'));
          done();
        });
      });
    });

    it('Should respond with a custom index file if it exists', (done) => {
      const html = fs.readFileSync(fixture('custom-index', 'index.html'), 'utf8');
      const spawnit = makeSpawnit('custom-index');

      spawnit.stdout.once('data', (data) => {

        request({ 
          uri: 'http://localhost:1337/foo/bar/baz', 
        }, (err, res, body) => {
          spawnit.kill();
          if (err) throw err;
          assert(html === body);
          done();
        });

      });

    });

    it('Can use custom browserify and sass options', (done) => {
      const spawnit = makeSpawnit('custom-index');

      spawnit.stdout.once('data', (data) => {
        const servedBundle = new Promise((resolve, reject) => {
          appRequest('/_spawnit/bundle', (err, res, body) => {
            if (err) throw err;
            resolve(body);
          });
        });
        const servedCss = new Promise((resolve, reject) => {
          appRequest('/_spawnit/css', (err, res, body) => {
            if (err) throw err;
            resolve(body);
          });
        });

        Promise.all([servedBundle, servedCss]).then((values) => {
          spawnit.kill();
          assert(values[0].includes('custom browserify opts'));
          assert(values[1].includes('.custom.styles'));
          done();
        });

      });
    });

    it('Starts a server for web socket communication', (done) => {
      const client = new Client();

      client.on('connect', () => {
        spawnit.kill();
        done();
      });

      const spawnit = makeSpawnit();
      spawnit.stdout.on('data', (data) => {
        if (data.toString().includes('1338')) {
          client.connect('ws://localhost:1338');
        }
      });

    });
  });

});
