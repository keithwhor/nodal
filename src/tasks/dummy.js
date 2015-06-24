module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');

  class DummyTask extends Nodal.SchedulerTask {

    __initialize__(app) {

      console.log('Dummy task initialized');

    }

    exec(app) {

      console.log('Dummy task executed');

    }

  }

  return DummyTask;

})();
