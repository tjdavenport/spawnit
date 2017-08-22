const { join } = require('path');

module.exports = {
  staticAssets: [
    {
      route: '/foo/bar',
      source: join(process.cwd(), 'assets'),
    }
  ],
};
