const notifier = require('node-notifier');

const drivers = {
  desktop(msg) {
    notifier.notify(msg);
  },
  console(msg) {
    const iso = new Date().toISOString();
    console.log(`[ ${iso} ] ${msg}`);
  },
  array(msg) {
    this.logs.push(msg);
  },
};

module.exports = class Logger {
  constructor(driverName) {
    this.defaultDriver = driverName;
    this.logs = [];
  }
  log(msg, driverName) {
    let log;

    if (driverName) {
      log = drivers[driverName].bind(this);
    } else {
      log = drivers[this.defaultDriver].bind(this);
    }

    log(msg);
  }
};
