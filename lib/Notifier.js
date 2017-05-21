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
    this.notifications.push(msg);
  },
};

module.exports = class Notifier {
  constructor(driverName) {
    this.defaultDriver = driverName;
    this.notifications = [];
  }
  notify(msg, driverName) {
    let notify;

    if (driverName) {
      notify = drivers[driverName].bind(this);
    } else {
      notify = drivers[this.defaultDriver].bind(this);
    }

    notify(msg);
  }
};
