const defaults = require('./defaults');

module.exports = {
  dev(options, done = () => {}) {
    const app = require('./app');
    const port = options.port || defaults.PORT;

    console.log('derp');

    app.listen(port, () => {
      done();
    });
  },
};
