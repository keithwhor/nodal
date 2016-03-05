module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');

  class CORSAuthorizationMiddleware {

      exec(controller, callback) {

          controller.allowOrigin('*');
          controller.appendToHeader('Access-Control-Allow-Headers', 'Authorization');
          callback(null);

      }

  }

  return CORSAuthorizationMiddleware;

})();
