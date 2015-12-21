module.exports = (function() {

  'use strict';

  class Middleware {

    exec(controller, data, fnComplete) {

      let err = null;
      return fnComplete(err, data);

    }

  }

  return Middleware;

})();
