const defaults = require('./defaults');

module.exports = {
  dev(options) {
    const port = options.port || defaults.PORT;

    console.log(port);
  },
};
