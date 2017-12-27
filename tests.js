const fs = require('fs');
const path = require('path');
const { encode } = require('he');
const assert = require('assert');
const request = require('request');
const Logger = require('./lib/Logger');
const remote = require('./lib/remote');
const makeApp = require('./lib/makeApp');
const makeCss = require('./lib/makeCss');
const getHtml = require('./lib/getHtml');
const commands = require('./lib/commands');
const Client = require('websocket').client;
const child_process = require('child_process');
const makeBrowserify = require('./lib/makeBrowserify');
const makeLinter = require('./lib/makeLinter');

describe('spawnit', () => {
  let appRequest = request.defaults({
    baseUrl: 'http://localhost:1337',
    json: true,
  });
  function fixture() {
    return path.join(...[process.cwd(), 'fixture'].concat(Array.from(arguments)));
  }

  describe('express server', () => {
    let server;
    let app;

    before('Start the http server', (done) => {
      app = makeApp({
        wssPort: 1338,
        logDriver: 'array',
        misc: () => {  },
        browserifyOpts: {
          entries: ['./fixture/express-server/index.js'],
        },
        scripts: [
          fixture('script1.js'),
          fixture('script2.js'),
        ],
        misc: function() {},
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

    it('Should have a remote script endpoint', (done) => {
      appRequest('/_spawnit/remote', (err, res, body) => {
        assert(body.includes(remote.toString()));
        done();
      });
    });

    it('Should have a vendor scripts endpoint', (done) => {
      appRequest('/_spawnit/scripts', (err, res, body) => {
        assert(body.includes('sourceMappingURL'));
        assert(body.includes('alert(\'foo\')'));
        assert(body.includes('alert(\'bar\')'));
        done();
      });
    });

    it('Should have a bundle endpoint', (done) => {
      const contents = fs.readFileSync('./fixture/express-server/index.js');

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

      b.bundle((err, buff) => {
        appRequest('/_spawnit/bundle', (reqErr, res, body) => {
          assert(body.includes(encode(err.toString())));
          assert(app.get('logger').logs.includes(err.toString()));
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

    it('Should lint files based on cofiguration, erroring ', (done) => {
      // create a configuration file that must find semicolons and errors when they are missing
      const configSemisRequired = require('./fixture/express-server/eslint-opts.js');
      // create a config that doesn't
      const configNoSemis = require('./fixture/express-server/eslint-opts-no-semis.js');

      app.set('linter', makeLinter(configNoSemis, app.get('logger')));
      const passTest = app.get('linter').process();

      app.set('linter', makeLinter(configSemisRequired, app.get('logger')));
      const failTest = app.get('linter').process();


      passTest
        .then((data) => { assert(data); })
        .catch(() => { assert.fail('pass', 'fail', '"passTest" was expected to pass.'); });

      failTest
        .then((data)=> { assert.fail('fail', 'pass', '"failTest" was expected to fail.'); })
        .catch(() => {
          assert(true);
          app.set('linter', null);
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

    it('Should create static asset endpoints', (done) => {
      const spawnit = makeSpawnit('static-assets');

      spawnit.stdout.once('data', (data) => {
        appRequest('/foo/bar/foo.txt', (err, res, body) => {
          if (err) throw err;
          assert(body.includes('bar'));
          spawnit.kill();
          done();
        });
      });
    });

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

    it('Supports ssl', (done) => {
      const spawnit = makeSpawnit('ssl');
      const secureReq = request.defaults({
        baseUrl: 'https://localhost:1337',
        json: true,
      });

      spawnit.stdout.once('data', (data) => {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
        secureReq('/_spawnit/status', (err, res, body) => {
          if (err) throw err;
          assert(body.message === 'it works!');
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1"
          spawnit.kill();
          done();
        });

      });
    });


  });

});
