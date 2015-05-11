module.exports = (function() {

  var url = require('url');

  var Template = require('./template.js');

  var Model = require('./model.js');
  var ComposerResult = require('./composer_result.js');

  var API = require('./api.js');

  function Controller(request, response, middlewareManager) {

    this._middlewareManager = middlewareManager;
    this._initializeTime = (new Date()).valueOf();
    this._request = request;
    this._response = response;
    this._path = url.parse(this._request.url, true).pathname;
    this._status = null;
    this._headers = {};

  }

  Controller.prototype.request = function() {
    return this._request;
  };

  Controller.prototype.path = function() {
    return this._path;
  };

  Controller.prototype.getStatus = function() {
    return this._status;
  };

  Controller.prototype.status = function(value) {
    this._status = value | 0;
    return this._status;
  };

  Controller.prototype.setHeaders = function(object) {
    var keys = Object.keys(object);
    var headers = {};
    for(var i = 0, len = keys.length; i < len; i++) {
      headers[keys[i]] = object[keys[i]];
    }
    this._headers = headers;
    return headers;
  };

  Controller.prototype.setHeader = function(key, value) {
    this._headers[key] = value;
    return value;
  };

  Controller.prototype.getHeader = function(key, defaultValue) {
    return this._headers.hasOwnProperty(key) ? this._headers[key] : defaultValue;
  };

  Controller.prototype.unauthorized = function(msg) {
    this.status(401);
    this.render(API.error(msg || 'Unauthorized'));
  };

  Controller.prototype.render = function(data, templateData) {

    if(!data) { data = ''; }

    if (data instanceof Buffer) {
      this.getHeader('Content-Type') || this.setHeader('Content-Type', 'text/html');
    } else if (data instanceof Template) {
      this.getHeader('Content-Type') || this.setHeader('Content-Type', 'text/html');
      data = data.render(templateData);
    } else if (data instanceof Model || data instanceof ComposerResult) {
      this.getHeader('Content-Type') || this.setHeader('Content-Type', 'application/json');
      data = API.format(data);
      data.meta.error && !this.getStatus() && this.status(400);
      data = JSON.stringify(data);
    } else if (typeof data === 'function') {
      this.getHeader('Content-Type') || this.setHeader('Content-Type', 'text/html');
      data = data(templateData);
    } else if (typeof data === 'object') {
      this.getHeader('Content-Type') || this.setHeader('Content-Type', 'application/json');
      data = JSON.stringify(data);
    } else {
      this.getHeader('Content-Type') || this.setHeader('Content-Type', 'text/html');
      data = data + '';
    }

    this.getStatus() || this.status(200);

    this._middlewareManager.exec(this, data, (function(e, data) {
      if (e) {
        this.setHeader('Content-Type', 'text/plain');
        this.status(500);
        this.end(e.message || 'Unresolved error');
        return;
      }
      this.end(data);
    }).bind(this));

    return true;

  };

  Controller.prototype.end = function(data) {

    this._response.writeHead(this._status, this._headers);
    this._response.end(data);

    console.log(this._request.url + ' loaded in: ' + ((new Date()).valueOf() - this._initializeTime) + 'ms');

  };

  Controller.prototype.get = function() {
    this.status(501);
    this.setHeader('Content-Type', 'text/plain');
    this.render('501 - Not Implemented');
  };

  Controller.prototype.post = Controller.prototype.get;

  Controller.prototype.put = Controller.prototype.get;

  Controller.prototype.del = Controller.prototype.get;

  return Controller;

})();
