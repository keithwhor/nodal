module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');

  class DummyTask extends Nodal.SchedulerTask {

    exec() {

      console.log('Dummy task executed');

    }

  }

  return DummyTask;

})();
