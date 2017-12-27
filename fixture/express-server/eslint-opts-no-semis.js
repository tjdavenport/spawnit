const path = require('path');

module.exports = {
  useEslintrc: false,
  envs: ["es6", "commonjs", "node", "browser"],
  cache: true,
  cwd: path.join(__dirname, '../lintables'),
  rules: {
    semi: 0,
  }
};
