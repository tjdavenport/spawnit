const servers = [];
let watcher;

function cleanup(options, err) {
  servers.forEach((server) => {
    server.close();
  });
  watcher.removeAll();

  if (err) console.log(err);

  process.exit();
}

module.exports = {
  setWatcher(passedWatcher) {
    watcher = passedWatcher;
  },
  servers: servers,
  bind() {
    process.on('exit SIGINT SIGTERM uncaughtException', cleanup.bind(null, {}));
  },
};
