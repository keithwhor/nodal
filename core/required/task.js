module.exports = (function() {

  'use strict';

  /**
  * Do not need to extend from this class for new Tasks, just use this as a reference template.
  * @class
  */
  class Task {

    constructor() {}

    /**
    * Execute the task
    * @param {Nodal.Application} app the Application Instance
    * @param {object} arguments passed to the task on the command line
    * @param {function({Error} err)} callback The callback to be run upon completion
    */
    exec(app, args, callback) {}

  }

  return Task;

})();
