module.exports = (() => {

  'use strict';

  const Nodal = require('nodal');

  const SchedulerMain = Nodal.require('schedulers/main.js');

  SchedulerMain.start();

})();
