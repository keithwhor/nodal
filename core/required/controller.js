module.exports = (function() {

  'use strict';

  const url = require('url');
  const Template = require('./template.js');
  const Model = require('./model.js');
  const API = require('./api.js');

  /**
  * A new Controller instance is created by the Router when its associated route is hit, handles all business logic
  * @class
  */
  class Controller {

    /**
    * @param {http.ClientRequest} request Incoming HTTP Request
    * @param {http.ServerResponse} response Outgoing HTTP Response
    * @param {Object} params HTTP request parameters containing: location (route), query (GET), body (POST), and id values
    * @param {Nodal.Application} app Parent application object
    */
    constructor(request, response, params, app) {

      this._initializeTime = (new Date()).valueOf();
      this._request = request;
      this._response = response;
      this._path = url.parse(this._request.url, true).pathname;
      this._status = null;
      this._headers = {};

      Object.defineProperty(this, 'app', {enumerable: true, value: app});
      Object.defineProperty(this, 'params', {enumerable: true, value: params});

    }

    /**
    * Specifies CORS (cross origin resource sharing) headers.
    * @param {string} value Use '*' for a generic API service that accepts requests from anywhere, otherwise specific a domain.
    * @return {this}
    */
    allowOrigin(value) {

      this.setHeader('Access-Control-Allow-Origin', value);
      this.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      this.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

      return this;

    }

    /**
    * Intended to be overwritten when inherited. Used in AuthorizationController class.
    * @param {string} permissionName The permission name (and everything below) you'd like to allow.
    * @param {function({Error} err)} callback Function to execute upon authorization check.
    * @return {this}
    */
    authorize(permissionName, callback) {

      callback(null);
      return this;

    }

    /**
    * Return a copy of an object with only the specified fields allowed.
    * @experimental
    * @param {Object} obj The object to copy from
    * @param {Array} fields The keys you wish to keep
    * @return {Object}
    */
    filterParams(obj, fields) {

      let filterObj = {};

      fields
        .map(k => ((filterObj[k] = obj[k]), k))
        .filter(k => filterObj[k] === undefined)
        .forEach(k => delete filterObj[k]);

      return filterObj;

    }

    /**
    * Return the HTTP Request object
    * @return {http.ClientRequest}
    */
    request() {
      return this._request;
    }

    /**
    * The pathname used by the router to instantiate this controller
    * @return {string}
    */
    path() {
      return this._path;
    }

    /**
    * The current HTTP status code expected to be used by the outgoing http.ServerResponse
    * @return {number}
    */
    getStatus() {
      return this._status;
    }

    /**
    * Set the HTTP status code to be used by the outgoing http.ServerResponse
    * @param {number} value Outgoing HTTP status code
    * @return {number}
    */
    status(value) {
      this._status = value | 0;
      return this._status;
    }

    /**
    * Set HTTP headers to be used by the outgoing http.ServerResponse
    * @param {Object} object Object containing key-value pairs for HTTP headers
    * @return {Object} The headers object created
    */
    setHeaders(object) {
      let keys = Object.keys(object);
      let headers = {};
      for(let i = 0, len = keys.length; i < len; i++) {
        headers[keys[i]] = object[keys[i]];
      }
      this._headers = headers;
      return headers;
    }

    /**
    * Set HTTP header key-value pairs individually for the outgoing http.ServerResponse
    * @param {string} key HTTP header name
    * @param {string} value HTTP header value
    * @return {string} HTTP header value
    */
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

    /**
    * Return the value of an outgoing expected HTTP header
    * @param {string} key HTTP header value
    * @param {optional string} defaultValue The value to be returned if header is not set
    * @return {string}
    */
    getHeader(key, defaultValue) {
      return this._headers.hasOwnProperty(key) ? this._headers[key] : defaultValue;
    }

    /**
    * Creates a 302 redirect to the desired location
    * @param {string} location
    */
    redirect(location) {
      this.status(302);
      this.setHeader('Location', location);
      this.render();
    }

    /**
    * Using API formatting, send an http.ServerResponse indicating there was a Bad Request (400)
    * @param {string} msg Error message to send
    * @param {Object} details Any additional details for the error (must be serializable)
    * @return {boolean}
    */
    badRequest(msg, details) {
      this.status(400);
      this.render(API.error(msg || 'Bad Request', details));
      return true;
    }

    /**
    * Using API formatting, send an http.ServerResponse indicating there was an Unauthorized request (401)
    * @param {string} msg Error message to send
    * @param {Object} details Any additional details for the error (must be serializable)
    * @return {boolean}
    */
    unauthorized(msg, details) {
      this.status(401);
      this.render(API.error(msg || 'Unauthorized', details));
      return true;
    }

    /**
    * Using API formatting, send an http.ServerResponse indicating the requested resource was Not Found (404)
    * @param {string} msg Error message to send
    * @param {Object} details Any additional details for the error (must be serializable)
    * @return {boolean}
    */
    notFound(msg, details) {
      this.status(404);
      this.render(API.error(msg || 'Not Found', details));
      return true;
    }

    /**
    * Using API formatting, send an http.ServerResponse indicating there were Too Many Requests (429) (i.e. the client is being rate limited)
    * @param {string} msg Error message to send
    * @param {Object} details Any additional details for the error (must be serializable)
    * @return {boolean}
    */
    tooManyRequests(msg, details) {
      this.status(429);
      this.render(API.error(msg || 'Too Many Requests', details));
      return true;
    }

    /**
    * Using API formatting, send an http.ServerResponse indicating there was an Internal Server Error (500)
    * @param {string} msg Error message to send
    * @param {Object} details Any additional details for the error (must be serializable)
    * @return {boolean}
    */
    error(msg, details) {
      this.status(500);
      this.render(API.error(msg || 'Internal Server Error', details));
      return true;
    }

    /**
    * Using API formatting, generate an error or respond with model / object data.
    * @param {Error|Object|Array|Nodal.Model|Nodal.ModelArray} data Object to be formatted for API response
    * @param {optional Array} The interface to use for the data being returned, if not an error.
    * @param {Object} options Options object to send to Model#toObject
    * @return {boolean}
    */
    respond(data, arrInterface, options) {

      if (data instanceof Error) {

        if (data.notFound) {
          return this.notFound(data.message, data.details);
        }

        return this.badRequest(data.message, data.details);

      }

      this.render(API.format(data, arrInterface, options));
      return true;

    }

    /**
    * Send an http.ServerResponse back to the client with data to render
    * @param {string|Buffer|Object} data Data to be returned to the client. Buffers will be written as binary, Objects will be JSON-serialized, and strings will be output as-is.
    * @return {boolean}
    */
    render(data) {

      if (!data) { data = ''; }

      if (data instanceof Buffer) {

        this.getHeader('Content-Type') || this.setHeader('Content-Type', 'text/html');

      } else if (typeof data === 'object') {

        this.getHeader('Content-Type') || this.setHeader('Content-Type', 'application/json');

        try {
          data = JSON.stringify(data);
        } catch(e) {
          data = {};
        }

      } else {

        this.getHeader('Content-Type') || this.setHeader('Content-Type', 'text/html');
        data = data + '';

      }

      this.getStatus() || this.status(200);
      this.getHeader('X-Powered-By') || this.setHeader('X-Powered-By', 'Nodal');

      this.app.middleware.exec(this, data, (e, data) => {

        if (e) {
          this.setHeader('Content-Type', 'text/plain');
          this.status(500);
          this.write(e.message || 'Unresolved error');
          return;
        }

        if (data instanceof Buffer) {
          this.write(data, 'binary');
        } else {
          this.write(data);
        }

      });

      return true;

    }

    /**
    * Use Controller#render instead (which calls this method). Ends the http.ServerResponse by sending data.
    * @param {string|Buffer} data Response to send to client
    * @return {boolean}
    */
    write(data) {

      this._response.writeHead(this._status, this._headers);
      this._response.end(data);

      console.log(this._request.url + ' loaded in: ' + ((new Date()).valueOf() - this._initializeTime) + 'ms');

      return true;

    }

    /**
    * Method called when a route is hit with a GET request and no "id" parameter. Intended to be overwritten when inherited. Defaults to calling Controller#get.
    */
    index() {
      this.get.apply(this, arguments);
    }

    /**
    * Method called when a route is hit with a GET request and an "id" parameter. Intended to be overwritten when inherited. Defaults to calling Controller#get.
    */
    show() {
      this.get.apply(this, arguments);
    }

    /**
    * Method called when a route is hit with a POST request. Intended to be overwritten when inherited. Defaults to calling Controller#post.
    */
    create() {
      this.post.apply(this, arguments);
    }

    /**
    * Method called when a route is hit with a PUT request. Intended to be overwritten when inherited. Defaults to calling Controller#put.
    */
    update() {
      this.put.apply(this, arguments);
    }

    /**
    * Method called when a route is hit with a DELETE request. Intended to be overwritten when inherited. Defaults to calling Controller#post.
    */
    destroy() {
      this.del.apply(this, arguments);
    }

    /**
    * Method called when a route is hit with a GET request, if not first intercepted by custom Controller#index or Controller#show methods. Intended to be overwritten when inherited.
    */
    get() {
      this.status(501);
      this.setHeader('Content-Type', 'text/plain');
      this.render('501 - Not Implemented');
    }

    /**
    * Method called when a route is hit with a PUT request, if not first intercepted by custom Controller#update method. Intended to be overwritten when inherited.
    */
    put() {
      this.status(501);
      this.setHeader('Content-Type', 'text/plain');
      this.render('501 - Not Implemented');
    }

    /**
    * Method called when a route is hit with a POST request, if not first intercepted by custom Controller#create method. Intended to be overwritten when inherited.
    */
    post() {
      this.status(501);
      this.setHeader('Content-Type', 'text/plain');
      this.render('501 - Not Implemented');
    }

    /**
    * Method called when a route is hit with a DELETE request, if not first intercepted by custom Controller#destroy method. Intended to be overwritten when inherited.
    */
    del() {
      this.status(501);
      this.setHeader('Content-Type', 'text/plain');
      this.render('501 - Not Implemented');
    }

    /**
    * Method called when a route is hit with an OPTIONS request. Typically unused, exists for CORS purposes.
    */
    options() {
      this.status(200);
      this.render();
    }

  }

  return Controller;

})();
