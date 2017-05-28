const filewatcher = require('filewatcher');

module.exports = function(files) {
  const watcher = filewatcher();

  files.forEach((file) => {
    watcher.add(file);
  });

  return watcher;
};
