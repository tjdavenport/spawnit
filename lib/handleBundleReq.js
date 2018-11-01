const { encode } = require('he');

const renderErr = function(errMsg) {
  document.head.innerHTML = '';
  document.body.innerHTML = '<pre style="white-space: pre-wrap;font-size:20px;">' + errMsg + '</pre>';
};

module.exports = (bundler, res) => {
  res.set('Content-Type', 'application/javascript');
  return bundler.bundle((err, buff) => {
    if (err) {
      const renderScript = `
        var __spawnitRenderErr = ${renderErr.toString()};
        __spawnitRenderErr(\`${encode(err.toString())}\`);
      `;

      res.send(renderScript);
    } else {
      res.send(buff.toString());
    }
  });
};
