const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

app.get('/status', (req, res, next) => {
  res.json({
    message: 'it works!',
  });
});

app.get('/bundle', (req, res, next) => {
  let b = app.get('browserify');

  b.bundle((err, buf) => {

    if (err) {

      let errorScript = `
        var body = document.getElementsByTagName('body')[0];
        body.innerHTML = \`<pre>${err}</pre>\`;
      `;

      res.send(Buffer.from(errorScript));

    } else {
      res.send(buf);
    }

  });

});

module.exports = app;
