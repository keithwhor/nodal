module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');

  class DummyTask extends Nodal.SchedulerTask {

    exec(app, args, callback) {

      console.log('Dummy task executed');
      callback();

    }

  }

  return DummyTask;

})();
