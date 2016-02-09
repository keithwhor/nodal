module.exports = (function() {

  'use strict';

  class DummyInitializer {

    exec(callback) {
      console.log('Initializer Ready');
      callback(null);
    }

  }

  return DummyInitializer;

})();
