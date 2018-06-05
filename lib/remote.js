module.exports = function(port, protocol, domain) {
  var socket = new WebSocket(protocol + '://' + domain + ':' + port);

  socket.addEventListener('message', function(message) {
    var cssElement;

    if (message.data === 'reload') {
      window.location.reload();
    }

    if (message.data === 'inject-css') {
      cssElement = document.getElementById('_spawnitcss');
      cssElement.setAttribute('href', '/_spawnit/css?reload=' + new Date().getTime());
    }
  });
};
