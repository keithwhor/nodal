'use strict';

const crypto = require('crypto');

module.exports = class Auth {

  constructor() {

    this._permissions = {};
    this._key = '';
    this._ttl = 60 * 60 * 24 * 365;

  }

  setKey(key) {
    this._key = key;
    return key;
  }

  setTTL(ttl) {
    ttl = parseInt(ttl) || 0;
    this._ttl = Math.max(ttl, 60) | 0;
    return this._ttl;
  }

  getTTL() {
    return this._ttl;
  }

  createToken() {

    var value = [].slice.call(arguments).concat([new Date().valueOf()]).join('');

    return crypto.createHmac('md5', this._key).update(value).digest('hex');

  }

  definePermission(permissionName, value) {
    this._permissions[permissionName] = value | 0;
    return true;
  }

  permission(permissionName) {
    return this._permissions[permissionName] | 0;
  }

};
