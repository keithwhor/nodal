module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');

  class DummyTask extends Nodal.Task {

    exec(app, callback) {

      console.log('Dummy task executed');
      callback();

    }

  }

  return DummyTask;

})();
