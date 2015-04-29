module.exports = (function() {

  var crypto = require('crypto');

  function Auth() {

    this._authorized = {};
    this._key = '';
    this._permissions = {};
    this._minTTL = 10 * 60;
    this._TTL = this._minTTL;

  }

  Auth.prototype.setTTL = function(s) {
    this._TTL = Math.max(this._minTTL, parseInt(s) || 0);
  };

  Auth.prototype.setKey = function(key) {
    this._key = key;
  };

  Auth.prototype.createToken = function() {

    var value = [].slice.call(arguments).concat([new Date().valueOf()]).join('');

    return crypto.createHmac('md5', this._key)
      .update(value)
      .digest('hex');

  };

  Auth.prototype.definePermission = function(name, level) {
    this._permissions[name] = level | 0;
  };

  Auth.prototype.isExpired = function(token, time) {

    var authorized = this._authorized;
    var auth = authorized[token];

    if (!auth) {
      return true;
    }

    if (auth.expires < time) {
      delete this._authorized[token];
      return true;
    }

    return false;

  };

  Auth.prototype.exists = function(token) {
    return !this.isExpired(token, new Date().valueOf());
  };

  Auth.prototype.getLevel = function(permissionName) {
    return this._permissions[permissionName] | 0;
  };

  Auth.prototype.authorize = function(token, permissionName) {

    return this._authorized[token] = {
      level: this.getLevel(permissionName),
      expiresAt: new Date().valueOf() + this._TTL
    };

  };

  Auth.prototype.authenticate = function(token, permissionName) {

    if (!this.exists(token)) {
      return false;
    }

    var auth = this._authorized[token];

    return this.getLevel(permissionName) <= auth.level;

  };

  Auth.prototype.refresh = function() {

    var authorized = this._authorized;
    var newAuthorized = {};
    var auth, token;

    var time = new Date().valueOf();

    var tokens = Object.keys(authorized);

    for(var i = 0; i < tokens.length; i++) {
      token = tokens[i];
      auth = authorized[token];
      if (auth.expires > time) {
        newAuthorized[token] = auth;
      }
    }

    this._authorized = newAuthorized;

    return true;

  };

  return Auth;

})();
