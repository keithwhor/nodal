'use strict';

const Initializer = require('./initializer.js');
const async = require('async');

module.exports = class InitializerManager {

  constructor() {
    this._initializers = [];
  }

  use(initializerConstructor) {

    var initializer = new initializerConstructor();
    if (!(initializer instanceof Initializer)) {
      throw new Error('Invalid Initializer');
    }

    this._initializers.push(initializer);

  }

  exec(app, fnComplete) {

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

  }

};
