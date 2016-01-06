module.exports = (function() {

  'use strict';

  /**
  * Do not need to extend from this class for new Tasks, just use this as a reference template.
  * @class
  */
  class Task {

    constructor() {}

    /**
    * Execute the initializer.
    * @param {Nodal.Application} app the Application Instance
    * @param {function({Error} err)} callback The callback to be run upon completion
    */
    exec(app, callback) {}

  }

  return Task;

})();
