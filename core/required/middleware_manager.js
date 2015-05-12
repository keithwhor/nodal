'use strict';

  const Middleware = require('./middleware.js');
  const async = require('async');

module.exports = class MiddlewareManager {

  constructor() {
    this._middleware = [];
  }

  use(middlewareConstructor) {

    var middleware = new middlewareConstructor();
    if (!(middleware instanceof Middleware)) {
      throw new Error('Invalid Middleware');
    }

    this._middleware.push(middleware);

  }

  exec(controller, data, fnComplete) {

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

  }

};
