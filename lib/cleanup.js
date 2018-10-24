const exitHook = require('async-exit-hook');

const servers = [];
let watcher;
let beforeExit = () => Promise.resolve();

exitHook(cb => {
  beforeExit().then(() => {
    servers.forEach((server) => {
      server.close();
    });
    watcher.removeAll();
    cb();
  }).catch(err => {
    console.log(err);
    cb();
  });
});

function handler(options, code) {
}

module.exports = {
  setBeforeExit(q) {
    beforeExit = q;
  },
  setWatcher(passedWatcher) {
    watcher = passedWatcher;
  },
  servers,
};
