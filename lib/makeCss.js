const _ = require('underscore');
const sass = require('node-sass');

module.exports = function(passedOpts) {
  const defaultOpts = {
    file: './styles.scss',
    outFile: '/spawnit/styles/output.css',
    sourceMap: true,
  };
  const opts = _.defaults(passedOpts, defaultOpts);

  return new Promise((resolve, reject) => {
    sass.render(opts, (error, result) => {

      if (!error) {
        resolve(result.css);
      } else {
        reject(error);
      }

    });
  });
};
