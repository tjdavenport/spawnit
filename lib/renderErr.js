module.exports = function(errMsg) {
  document.head.innerHTML = '';
  document.body.innerHTML = '<pre style="white-space: pre-wrap;font-size:20px;">' + errMsg + '</pre>';
}

