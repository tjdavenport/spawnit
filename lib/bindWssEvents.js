module.exports = function(wss, app) {
  const logger = app.get('logger');
  const b = app.get('browserify');
  const watcher = app.get('watcher');

  const linter = app.get('linter');

  wss.on('connection', (ws) => {
    logger.log('WebSocket connection established');

    watcher.on('change', (file, stat) => {
      logger.log('Sending inject-css message');
      ws.send('inject-css', (err) => {  });
    });

    b.on('update', (event) => {
      // TODO: replace this with a call to run
      //  an "Updateables/Plugin Manager" or add seperate watcher
      if (linter) { linter.process(); }

      logger.log('Sending reload message');
      ws.send('reload', (err) => {  });
    });

  });

};
