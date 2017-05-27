const servers = [];

function cleanup(options, err) {
  servers.forEach((server) => {
    server.close();
  });

  if (err) console.log(err);

  process.exit();
}

module.exports = {
  servers: servers,
  bind() {
    process.on('exit SIGINT SIGTERM uncaughtException', cleanup.bind(null, {}));
  },
};
