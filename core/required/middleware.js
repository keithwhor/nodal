module.exports = (function() {

  function Middleware() {}

  Middleware.prototype.exec = function(controller, data, fnComplete) {

    var err = null;
    return fnComplete(err, data);

  };

  return Middleware;

})();
