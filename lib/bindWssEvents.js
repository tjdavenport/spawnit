module.exports = function(wss, app) {
  const logger = app.get('logger');

  wss.on('connection', (ws) => {
    logger.log('WE HAVE A CONNECTION');
  });

};
