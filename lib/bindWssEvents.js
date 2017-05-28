module.exports = function(wss, app) {
  const logger = app.get('logger');
  const b = app.get('browserify');

  wss.on('connection', (ws) => {
    logger.log('WebSocket connection established');

    b.on('update', (event) => {
      logger.log('Sending reload message');
      ws.send('reload', (err) => {  });
    });
  });

};
