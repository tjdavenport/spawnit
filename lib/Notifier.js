const notifier = require('node-notifier');

module.exports = class Notifier {
  constructor(driverName) {
    this.driverName = driverName;

    if (driverName === 'array') {
      this.notifications = [];
    }
  }
  notify(msg) {
    this.driver(msg);
  }
  get driver() {
    const drivers = {
      desktop(msg) {
        notifier.notify(msg);
      },
      console(msg) {
        console.log(msg);
      },
      array(msg) {
        this.notifications.push(msg);
      },
    };

    return drivers[this.driverName];
  }
};
