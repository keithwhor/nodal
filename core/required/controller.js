module.exports = (function() {

  var Template = require('./template.js');

  function Controller(request, response) {

    this._initializeTime = (new Date).valueOf();
    this._request = request;
    this._response = response;
    this._status = 200;
    this._headers = {'Content-Type': 'text/html'};

  };

  Controller.prototype.request = function() {
    return this._request;
  };

  Controller.prototype.status = function(value) {
    this._status = value | 0;
    return this._status;
  };

  Controller.prototype.headers = function(object) {
    var keys = Object.keys(object);
    var headers = {'Content-Type': 'text/html'};
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
      // do nothing
    } else if(data instanceof Template) {
      this.setHeader('Content-Type', 'text/html');
      data = data.render(templateData);
    } else if(typeof data === 'function') {
      this.setHeader('Content-Type', 'text/html');
      data = data(templateData);
    } else if(typeof data === 'object') {
      this.setHeader('Content-Type', 'application/json');
      data = JSON.stringify(data);
    } else {
      data = data + '';
    }

    this._response.writeHead(this._status, this._headers);
    this._response.end(data);

    console.log(this._request.url + ' loaded in: ' + ((new Date).valueOf() - this._initializeTime) + 'ms');

    return true;

  };

  Controller.prototype.get = function() {
    this.status(501);
    this.response('501 - Not Implemented');
  };

  Controller.prototype.post = function() {
    this.status(501);
    this.response('501 - Not Implemented');
  };

  Controller.prototype.put = function() {
    this.status(501);
    this.response('501 - Not Implemented');
  };

  Controller.prototype.delete = function() {
    this.status(501);
    this.response('501 - Not Implemented');
  };

  return Controller;

})();
