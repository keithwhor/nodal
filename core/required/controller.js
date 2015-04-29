module.exports = (function() {

  var url = require('url');
  var zlib = require('zlib');

  var Template = require('./template.js');

  function Controller(request, response) {

    this._initializeTime = (new Date()).valueOf();
    this._request = request;
    this._response = response;
    this._path = url.parse(this._request.url, true).pathname;
    this._status = 200;
    this._headers = {};

  }

  Controller.prototype.request = function() {
    return this._request;
  };

  Controller.prototype.path = function() {
    return this._path;
  };

  Controller.prototype.status = function(value) {
    this._status = value | 0;
    return this._status;
  };

  Controller.prototype.headers = function(object) {
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

  Controller.prototype.render = function(data, templateData) {

    if(!data) { data = ''; }

    if(data instanceof Buffer) {
      this.getHeader('Content-Type') || this.setHeader('Content-Type', 'text/html');
    } else if(data instanceof Template) {
      this.getHeader('Content-Type') || this.setHeader('Content-Type', 'text/html');
      data = data.render(templateData);
    } else if(typeof data === 'function') {
      this.getHeader('Content-Type') || this.setHeader('Content-Type', 'text/html');
      data = data(templateData);
    } else if(typeof data === 'object') {
      this.getHeader('Content-Type') || this.setHeader('Content-Type', 'application/json');
      data = JSON.stringify(data);
    } else {
      this.getHeader('Content-Type') || this.setHeader('Content-Type', 'text/html');
      data = data + '';
    }

    this.compress(data, this.end.bind(this));

    return true;

  };

  Controller.prototype.compress = function(data, callback) {

    var acceptEncoding = this._request.headers['accept-encoding'] || '';
    var canCompress = !!{
      'text/plain': 1,
      'text/html': 1,
      'text/xml': 1,
      'text/json': 1,
      'text/javascript': 1,
      'application/json': 1,
      'application/xml': 1,
      'application/javascript': 1,
      'application/octet-stream': 1
    }[this.getHeader('Content-Type')];

    if (canCompress) {

      if (acceptEncoding.match(/\bdeflate\b/)) {

        zlib.deflate(data, (function(err, result) {
          if (!err) {
            this.setHeader('Content-Encoding', 'deflate');
            callback(result);
            return;
          }
          callback(data);
        }).bind(this));
        return true;

      } else if (acceptEncoding.match(/\bgzip\b/)) {

        zlib.gzip(result, (function(err, result) {
          if (!err) {
            this.setHeader('Content-Encoding', 'gzip');
            callback(result);
            return;
          }
          callback(data);
        }).bind(this));

        return true;

      }

    }

    callback(data);
    return false;

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

  Controller.prototype.delete = Controller.prototype.get;

  return Controller;

})();
