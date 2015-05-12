module.exports = (function() {

  var Initializer = require('./initializer.js');
  var async = require('async');

  function InitializerManager() {
    this._initializers = [];
  }

  InitializerManager.prototype.use = function(initializerConstructor) {

    var initializer = new initializerConstructor();
    if (!(initializer instanceof Initializer)) {
      throw new Error('Invalid Initializer');
    }

    this._initializers.push(initializer);

  };

  InitializerManager.prototype.exec = function(app, fnComplete) {

    var mwa = [
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

    async.waterfall(mwa, function(err) {

      if (err) {
        throw err;
      }

      fnComplete();

    });

  };

  return InitializerManager;

})();
