const fs = require('fs');
const path = require('path');
const _ = require('underscore');

const defaultHtml = `
<!doctype html>
<html class="no-js" lang="">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="x-ua-compatible" content="ie=edge">
        <title>Spawnit</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link id="_spawnitcss" rel="stylesheet" href="/_spawnit/css">
    </head>
    <body>
        <div id="app"></div>
        <%= scriptTags %>
        <script src="/_spawnit/bundle"></script>
        <script src="/_spawnit/remote"></script>
    </body>
</html>
`;

module.exports = function(dirPath, scripts) {
  const searchFrom = path.resolve(dirPath) + path.sep;

  return new Promise((resolve, reject) => {
    try {
      let scriptTags = '';

      _.each(scripts, filename => {
        scriptTags += `<script type="text/javascript" src="/_spawnit/script/${path.basename(filename)}"></script>`;
      });

      fs.readFile(searchFrom + 'index.html', 'utf8', (err, data) => {
        const html = err ? defaultHtml : data;
        const template = _.template(html);
        resolve(template({
          scriptTags,
        }));
      });
    } catch (err) {
      reject(err)
    }
  });
};
