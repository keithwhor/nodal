module.exports = (function() {

  'use strict';

  const url = require('url');
  const Template = require('./template.js');
  const Model = require('./model.js');
  const ComposerResult = require('./composer/composer_result.js');
  const ComposerRecord = require('./composer/record.js');
  const API = require('./api.js');

  class Controller {

    constructor(request, response, middlewareManager) {

      this._middlewareManager = middlewareManager;
      this._initializeTime = (new Date()).valueOf();
      this._request = request;
      this._response = response;
      this._path = url.parse(this._request.url, true).pathname;
      this._status = null;
      this._headers = {};

    }

    allowOrigin(value) {

      this.setHeader('Access-Control-Allow-Origin', value);
      this.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      this.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

      return this;

    }

    filterParams(obj, fields) {

      let filterObj = {};

      fields
        .map(k => ((filterObj[k] = obj[k]), k))
        .filter(k => filterObj[k] === undefined)
        .forEach(k => delete filterObj[k]);

      return filterObj;

    }

    request() {
      return this._request;
    }

    path() {
      return this._path;
    }

    getStatus() {
      return this._status;
    }

    status(value) {
      this._status = value | 0;
      return this._status;
    }

    setHeaders(object) {
      let keys = Object.keys(object);
      let headers = {};
      for(let i = 0, len = keys.length; i < len; i++) {
        headers[keys[i]] = object[keys[i]];
      }
      this._headers = headers;
      return headers;
    }

    setHeader(key, value) {

      key = key.split('-').map(function(v) {
        return v[0].toUpperCase() + v.substr(1);
      }).join('-');

      if (key === 'Content-Type' && value.indexOf(';') === -1 && (
        value === 'application/javascript' ||
        value === 'application/json' ||
        value.indexOf('text/') === 0
      )) {
        value = value + '; charset=utf-8';
      }

      this._headers[key] = value;
      return value;

    }

    getHeader(key, defaultValue) {
      return this._headers.hasOwnProperty(key) ? this._headers[key] : defaultValue;
    }

    badRequest(msg, details) {
      this.status(400);
      this.render(API.error(msg || 'Bad Request', details));
      return true;
    }

    unauthorized(msg, details) {
      this.status(401);
      this.render(API.error(msg || 'Unauthorized', details));
      return true;
    }

    notFound(msg, details) {
      this.status(404);
      this.render(API.error(msg || 'Not Found', details));
      return true;
    }

    tooManyRequests(msg, details) {
      this.status(429);
      this.render(API.error(msg || 'Too Many Requests', details));
      return true;
    }

    error(msg, details) {
      this.status(500);
      this.render(API.error(msg || 'Internal Server Error', details));
      return true;
    }

    render(data, templateData) {

      if(!data) { data = ''; }

      if (data instanceof Buffer) {

        this.getHeader('Content-Type') || this.setHeader('Content-Type', 'text/html');

      } else if (data instanceof Template) {

        this.getHeader('Content-Type') || this.setHeader('Content-Type', 'text/html');
        data = data.render(templateData);

      } else if (data instanceof Model) {

        this.getHeader('Content-Type') || this.setHeader('Content-Type', 'application/json');
        data = API.formatModel(data, templateData);
        data.meta.error && !this.getStatus() && this.status(400);
        data = JSON.stringify(data);

      } else if (data instanceof ComposerResult || data instanceof ComposerRecord) {

        this.getHeader('Content-Type') || this.setHeader('Content-Type', 'application/json');
        data = API.format(data, templateData);
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
      this.getHeader('X-Powered-By') || this.setHeader('X-Powered-By', 'Nodal');

      this._middlewareManager.exec(this, data, (function(e, data) {
        if (e) {
          this.setHeader('Content-Type', 'text/plain');
          this.status(500);
          this.write(e.message || 'Unresolved error');
          return;
        }
        this.write(data);
      }).bind(this));

      return true;

    }

    write(data) {

      this._response.writeHead(this._status, this._headers);
      this._response.end(data);

      console.log(this._request.url + ' loaded in: ' + ((new Date()).valueOf() - this._initializeTime) + 'ms');

    }

    auth(self, params, app, authorize) {

      authorize(true);

    }

    get() {
      this.status(501);
      this.setHeader('Content-Type', 'text/plain');
      this.render('501 - Not Implemented');
    }

    put() {
      this.status(501);
      this.setHeader('Content-Type', 'text/plain');
      this.render('501 - Not Implemented');
    }

    post() {
      this.status(501);
      this.setHeader('Content-Type', 'text/plain');
      this.render('501 - Not Implemented');
    }

    del() {
      this.status(501);
      this.setHeader('Content-Type', 'text/plain');
      this.render('501 - Not Implemented');
    }

    options() {
      this.status(200);
      this.render();
    }

  }

  return Controller;

})();
