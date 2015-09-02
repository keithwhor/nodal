"use strict";

module.exports = (function() {

  const Initializer = require('./initializer.js');
  const async = require('async');

  class InitializerManager {

    constructor() {
      this._initializers = [];
    }

    use(initializerConstructor) {

      let initializer = new initializerConstructor();
      if (!(initializer instanceof Initializer)) {
        throw new Error('Invalid Initializer');
      }

      this._initializers.push(initializer);

    }

    exec(app, fnComplete) {

      let mwa = [
        function(callback) {
          callback(null);
        }
      ].concat(
        this._initializers.map(function(initializer) {
          return function(callback) {
            initializer.exec(app, callback);
          };
        })
      );

      async.waterfall(mwa, fnComplete);

    }

  }

  return InitializerManager;

})();
