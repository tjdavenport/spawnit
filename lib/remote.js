module.exports = function(port) {
  var socket = new WebSocket('ws://localhost:' + port);

  socket.addEventListener('message', function(data) {
    window.location.reload();
  });
};
