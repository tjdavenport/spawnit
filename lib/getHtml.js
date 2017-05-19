const fs = require('fs');
const path = require('path');

const defaultHtml = `
<!doctype html>
<html class="no-js" lang="">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="x-ua-compatible" content="ie=edge">
        <title>Spawnit</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="/_spawnit/css">
    </head>
    <body>
        <div id="app"></div>
        <script src="/_spawnit/bundle"></script>
    </body>
</html>
`;

module.exports = function(dirPath) {
  const searchFrom = path.resolve(dirPath) + path.sep;

  return new Promise((resolve, rejext) => {
    try {
      fs.readFile(searchFrom + 'index.html', 'utf8', (err, data) => {
        if (err) {
          resolve(defaultHtml);
        } else {
          resolve(data);
        }
      });
    } catch (err) {
      reject(err)
    }
  });
};
