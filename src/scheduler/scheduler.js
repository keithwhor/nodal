module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');

  const DummyTask = Nodal.require('./scheduler/tasks/dummy.js');

  class Scheduler extends Nodal.Scheduler {

    __initialize__() {

      this.minutely(30).perform(DummyTask);

    }

  }

  return Scheduler;

})();
