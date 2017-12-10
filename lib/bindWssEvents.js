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
      const resend = ()=> {
        logger.log('Sending reload message');
        ws.send('reload', (err) => {  });
      };

      // TODO: replace this with a call to run
      //  an "Updateables/Plugin Manager" or add seperate watcher
      if (linter) {
        var promise = linter.process();
        promise
          .then(()=> { resend(); })
          .catch((data)=> {
            logger.log('linting failed');
          });
      }
      else {
        resend();
      }

    });
  });

};
