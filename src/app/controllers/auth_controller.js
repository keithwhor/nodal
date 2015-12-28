module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');
  const authorizer = new Nodal.Authorizer();

  authorizer.definePermission('user', 0);
  authorizer.definePermission('admin', 10);

  class AuthController extends Nodal.Controller {

    authorize(permissionName, callback) {

      callback(null);

    }

  }

  return AuthController;

})();
