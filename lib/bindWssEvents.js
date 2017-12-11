module.exports = function(wss, app) {
  const logger = app.get('logger');
  const b = app.get('browserify');
  const watcher = app.get('watcher');

  wss.on('connection', (ws) => {
    logger.log('WebSocket connection established');

    watcher.on('change', (file, stat) => {
      logger.log('Sending inject-css message');
      ws.send('inject-css', (err) => {  });
    });

    b.on('update', (event) => {
      logger.log('Sending reload message');
      ws.send('reload', (err) => {  });
    });

  });

};
