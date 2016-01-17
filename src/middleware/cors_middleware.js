module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');

  class CORSMiddleware extends Nodal.Middleware {

    exec(controller, callback) {

      controller.allowOrigin('*');
      callback(null);

    }

  }

  return CORSMiddleware;

})();
