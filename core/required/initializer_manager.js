module.exports = (function() {

  'use strict';

  const async = require('async');

  class InitializerManager {

    constructor() {
      this._initializers = [];
    }

    use(initializerConstructor) {

      let initializer = new initializerConstructor();
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
