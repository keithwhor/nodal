module.exports = (function() {

  'use strict';

  const crypto = require('crypto');

  /**
  * Intercepts requests to controller using Controller#authorize. Use with app using Application#useAuthorizer.
  * @class
  */
  class Authorizer {

    constructor() {

      this._permissions = {};
      this._key = ''

    }

    /**
    * Creates a 32-byte md5 access token by combining the current date and any provided arguments.
    * @return {string}
    */
    createAccessToken() {

      let value = [].slice.call(arguments).concat([new Date().valueOf()]).join(':');
      return crypto.createHmac('md5', this._key).update(value).digest('hex');

    }

    /**
    * Associates a permission name with an integer value.
    * @param {string} permissionName The permission name, eg. "admin"
    * @param {number} value The value, will be cast to signed 32-bit int
    * @return {boolean}
    */
    definePermission(permissionName, value) {
      this._permissions[permissionName] = value | 0;
      return true;
    }

    /**
    * Provides the integer value of a permissionName, as defined by Authorizer#definePermission
    * @param {string} permissionName The permission name, eg. "admin"
    * @return {number}
    */
    permission(permissionName) {
      return this._permissions[permissionName] | 0;
    }

    /**
    * Lets us know if, given a permissionName, an associated numeric value (level) is valid
    * @param {string} permissionName The permission name, eg. "admin"
    * @param {number} permissionLevel A numeric value (preferably integer) to test
    * @return {boolean}
    */
    permissible(permissionName, permissionLevel) {
      return this.permission(permissionName) <= (parseInt(permissionLevel) || 0);
    }

    /**
    * Default exec method. Should be overwritten using Authorizer#auth
    */
    exec(controller, permissionName, callback) {

      callback(null);

    }

    /**
    * Overwrites exec method using the wrapperFn provided.
    * @param {function} wrapperFn The function to overwrite Authorizer#exec with
    * @return {this}
    */
    auth(wrapperFn) {

      this.exec = wrapperFn.bind(this);
      return this;

    }

  }

  return Authorizer;

})();
