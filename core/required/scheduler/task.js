module.exports = (function() {

  'use strict';

  class SchedulerTask {

    constructor(app) {

      this.__initialize__(app);

    }

    __initialize__(app) {}
    exec(app) {}

  }

  return SchedulerTask;

})();
