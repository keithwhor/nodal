"use strict";

module.exports = (function() {

  class Middleware {

    exec(controller, data, fnComplete) {

      let err = null;
      return fnComplete(err, data);

    }

  }

  return Middleware;

})();
