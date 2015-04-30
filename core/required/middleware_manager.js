module.exports = (function() {

  var Middleware = require('./middleware.js');
  var async = require('async');

  function MiddlewareManager() {
    this._middleware = [];
  }

  MiddlewareManager.prototype.use = function(middlewareConstructor) {

    var middleware = new middlewareConstructor();
    if (!(middleware instanceof Middleware)) {
      throw new Error('Invalid Middleware');
    }

    this._middleware.push(middleware);

  };

  MiddlewareManager.prototype.exec = function(controller, data, fnComplete) {

    var mwa = [
      function(callback) {
        callback(null, data);
      }
    ].concat(
      this._middleware.map(function(middleware) {
        return function(data, callback) {
          middleware.exec(controller, data, function(err, data) {
            callback(err, data);
          });
        };
      })
    );

    async.waterfall(mwa, fnComplete);

  };

  return MiddlewareManager;

})();
