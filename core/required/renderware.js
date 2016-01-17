module.exports = (function() {

  'use strict';

  /**
  * Do not need to extend from this class for new Renderware, just use this as a reference template.
  * @class
  */
  class Renderware {

    constructor() {}

    /**
    * Execute the renderware.
    * @param {Nodal.Controller} controller the Controller Instance
    * @param {string|Buffer} data The data about the be rendered
    * @param {function({Error} err, {string|Buffer} data)} callback the callback to be run upon completion
    */
    exec(controller, data, callback) {

      let err = null;
      return callback(err, data);

    }

  }

  return Renderware;

})();
