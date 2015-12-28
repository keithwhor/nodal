module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');

  let authorizer = new Nodal.Authorizer();

  authorizer.definePermission('user', 0);
  authorizer.definePermission('admin', 10);

  authorizer.auth((controller, permissionName, callback) => {

    callback(null);

  });

  return authorizer;

})();
