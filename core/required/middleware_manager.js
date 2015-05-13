"use strict";

module.exports = (function() {

  const Middleware = require('./middleware.js');
  const async = require('async');

  class MiddlewareManager {

    constructor() {
      this._middleware = [];
    }

    use(middlewareConstructor) {

      let middleware = new middlewareConstructor();
      if (!(middleware instanceof Middleware)) {
        throw new Error('Invalid Middleware');
      }

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
