module.exports = (function() {

  'use strict';

  const crypto = require('crypto');

  class Authorizer {

    constructor() {

      this._permissions = {};

    }

    createAccessToken() {

      let value = [].slice.call(arguments).concat([new Date().valueOf()]).join(':');
      return crypto.createHmac('md5').update(value).digest('hex');

    }

    definePermission(permissionName, value) {
      this._permissions[permissionName] = value | 0;
      return true;
    }

    permission(permissionName) {
      return this._permissions[permissionName] | 0;
    }

    permissible(permissionName, permissionLevel) {
      return this.permission(permissionName) <= (parseInt(permissionLevel) || 0);
    }

    exec(controller, params, app, permissionName, callback) {

      callback(null);

    }

    auth(wrapperFn) {

      this.exec = wrapperFn.bind(this);

    }

  }

  return Authorizer;

})();
