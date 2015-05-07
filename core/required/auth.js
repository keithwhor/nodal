module.exports = (function() {

  var crypto = require('crypto');

  function Auth() {

    this._permissions = {};
    this._key = '';
    this._ttl = 60 * 60 * 24 * 365;

  }

  Auth.prototype.setKey = function(key) {
    this._key = key;
    return key;
  };

  Auth.prototype.setTTL = function(ttl) {
    ttl = parseInt(ttl) || 0;
    this._ttl = Math.max(ttl, 60) | 0;
    return this._ttl;
  };

  Auth.prototype.getTTL = function() {
    return this._ttl;
  };

  Auth.prototype.createToken = function() {

    var value = [].slice.call(arguments).concat([new Date().valueOf()]).join('');

    return crypto.createHmac('md5', this._key).update(value).digest('hex');

  };

  Auth.prototype.definePermission = function(permissionName, value) {
    this._permissions[permissionName] = value | 0;
    return true;
  };

  Auth.prototype.permission = function(permissionName) {
    return this._permissions[permissionName] | 0;
  };

  return Auth;

})();
