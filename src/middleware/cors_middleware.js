module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');

  class CORSMiddleware extends Nodal.Middleware {

    exec(controller, data, callback) {

      controller.allowOrigin('*');

      callback(null, data);
      return false;

    }

  }

  return CORSMiddleware;

})();
