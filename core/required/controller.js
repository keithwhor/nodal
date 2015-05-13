"use strict";

module.exports = (function() {

  const url = require('url');
  const Template = require('./template.js');
  const Model = require('./model.js');
  const ComposerResult = require('./composer_result.js');
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
      this._headers[key] = value;
      return value;
    }

    getHeader(key, defaultValue) {
      return this._headers.hasOwnProperty(key) ? this._headers[key] : defaultValue;
    }

    unauthorized(msg) {
      this.status(401);
      this.render(API.error(msg || 'Unauthorized'));
      return true;
    }

    badRequest(msg) {
      this.status(400);
      this.render(API.error(msg || 'Bad Request'));
    }

    render(data, templateData) {

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

    }

    end(data) {

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

  }

  return Controller;

})();
