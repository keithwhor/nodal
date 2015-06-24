module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');
  const scheduler = new Nodal.Scheduler();

  const DummyTask = Nodal.require('tasks/dummy.js');

  scheduler.minutely(30).perform(DummyTask);

  return scheduler;

})();
