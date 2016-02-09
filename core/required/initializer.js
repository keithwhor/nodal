module.exports = (function() {

  'use strict';

  /**
  * Do not need to extend from this class for new Initializers, just use this as a reference template.
  * @class
  */
  class Initializer {

    constructor() {}

    /**
    * Execute the initializer.
    * @param {function({Error} err)} callback the callback to be run upon completion
    */
    exec(callback) {

      let err = null;
      return callback(err);

    }

  }

  return Initializer;

})();
