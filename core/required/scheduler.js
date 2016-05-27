module.exports = (function() {

  'use strict';

  const fxn = require('fxn');

  /**
  * Use to delegate tasks minutely, hourly, daily, or weekly.
  * @class
  */

  class Scheduler extends fxn.Scheduler {}
  return Scheduler;

})();
