module.exports = (function() {

  'use strict';

  const async = require('async');

  class MiddlewareManager {

    constructor() {
      this._middleware = [];
    }

    use(middlewareConstructor) {

      let middleware = new middlewareConstructor();
      this._middleware.push(middleware);

    }

    exec(controller, data, fnComplete) {

      let mwa = [
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

    }

  }

  return MiddlewareManager;

})();
