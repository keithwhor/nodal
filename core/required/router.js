module.exports = (function() {

  'use strict';

  const url = require('url');
  const qs = require('querystring');

  const Controller = require('./controller.js');

  /**
  * Routes are what the router uses to actually instantiate Controllers
  * @class
  */
  class Route {

    /**
    * @param {RegEx} regex The Regular Expression to match for the route
    * @param {class Nodal.Controller} controller The controller class to instantiate when a route is activated
    */
    constructor(regex, controller) {
      this._regex = null;
      if (typeof regex === 'string') {
        this._regex = new RegExp(regex);
      } else if(regex instanceof RegExp) {
        this._regex = regex;
      } else {
        throw new Error('Routes must be strings or valid regular expression');
      }
      if (!Controller.prototype.isPrototypeOf(controller.prototype)) {
        throw new Error('Route requires a valid Controller');
      }
      this._controller = controller;
    }

    /**
    * Check whether or not the route matches a given HTTP.ClientRequest path
    * @param {string} pathname The pathname to check against the route's regex
    * @return {boolean}
    */
    match(pathname) {
      return !!this._regex.exec(pathname);
    }

    /**
    * Parse query parameters from a query string. Matches arrays and object query param definitions. (obj[a]=1&obj[b]=2)
    * @param {string} query The query string to match
    * @return {Object} The parsed object
    */
    parseQueryParameters(query) {

      let obj = {};

      Object.keys(query).forEach(function(key) {

        let newKey, subKey;
        let value = query[key];
        let match = key.match(/(.*)\[(.*)\]$/);

        if (match) {

          newKey = match[1];
          subKey = match[2];

          if (subKey) {
            obj[newKey] = obj[newKey] || {};
            obj[newKey][subKey] = value;
            return;
          }

          value = !(value instanceof Array) ? [value] : value;

          obj[newKey] = value;
          return;

        }

        obj[key] = value;
        return;

      });

      return obj;

    }

    /**
    * Parse the POST body from an HTTP.ClientRequest. Accepts x-www-form-urlencoded or JSON.
    * @param {string} contentType The Content-Type header of the HTTP.ClientRequest
    * @param {string} body The POST body of the HTTP.ClientRequest
    * @return {Object} The body returned as JS Object
    */
    parseBody(contentType, body) {

      contentType = (typeof contentType === 'string') ? contentType.split(';')[0] : '';

      let fn = {
        'application/x-www-form-urlencoded': (function(body) {
          return {raw: body, data: this.parseQueryParameters(qs.parse(body))};
        }).bind(this),
        'application/json': function(body) {
          try {
            return {raw: body, data: JSON.parse(body)};
          } catch(e) {
            return {raw: body, data: {}};
          }
        }
      }[contentType];

      return fn ? fn.call(this, body) : {raw: body, data: {}};

    }

    /**
    * Activate the route once you know it has been hit.
    * @param {Nodal.Application} app The Nodal.Application instance assocatied with this route / router
    * @param {HTTP.ClientRequest} request
    * @param {HTTP.ServerResponse} response
    */
    execute(app, request, response) {

      let urlParts = url.parse(request.url, true);

      let buffers = [];
      let transferSize = 0;
      let query = this.parseQueryParameters(urlParts.query);
      let path = [].slice.call(urlParts.pathname.match(this._regex), 0);
      let id = urlParts.pathname.substr(path[0].length) || null;

      request.on('data', function(data) {
        buffers.push(data);
        transferSize += data.byteLength;
        if (transferSize > 1e6) {
          request.connection.destroy();
        }
      });

      let headers = {};
      Object.keys(request.headers).forEach(function(key) {
        headers[key] = request.headers[key];
      });

      request.on('end', () => {

        let buffer = buffers.length ? Buffer.concat(buffers) : new Buffer(0);
        let body = buffer.toString();

        let params = {
          path: path,
          location: {
            path: '/' + path[0].split('/').filter(v => !!v).join('/'),
            matches: path.slice(1)
          },
          id: id,
          query: query,
          buffer: buffer,
          body: this.parseBody(headers['content-type'], body),
          ip_address: headers['x-forwarded-for'] || request.connection.remoteAddress,
          headers: headers
        };

        let controller = new this._controller(
          request,
          response,
          params,
          app
        );

        let method = ({
          'GET': ['index', 'show'],
          'PUT': ['put', 'update'],
          'POST': ['create', 'create'],
          'DELETE': ['destroy', 'destroy'],
          'OPTIONS': ['options', 'options']
        }[request.method] || ['index', 'index'])[(id !== null) | 0];

        controller[method](controller, controller.params, controller.app);

      });

      return true;

    }

  }

  /**
  * Delegates HTTP.ClientRequest to specified routes, which dispatch Controllers
  * @class
  */
  class Router {

    constructor() {
      this._routes = [];
    }

    /**
    * Creates a route with a specified regex that dispatches a given Controller
    * @param {RegEx} regex The regex to match for the route
    * @param {class Nodal.Controller} Controller The Controller to dispatch
    */
    route(regex, Controller) {
      this._routes.push(new Route(regex, Controller));
    }

    /**
    * Finds the appropriate route given a pathname. Does a simple array iteration (first matching route wins).
    * @param {string} pathname The pathname from an HTTP.ClientRequest
    * @return {Route} The route instance that matches the pathname
    */
    find(pathname) {
      let routes = this._routes;
      for(let i = 0, len = routes.length; i < len; i++) {
        if(routes[i].match(pathname)) {
          return routes[i];
        }
      }
      return null;
    }

    /**
    * Delegates an HTTP.ClientRequest to a route / Controller. Used with Node's HTTP server. Given a generic plaintext 404 if no routes found.
    * @param {Nodal.Application} app Your Nodal application
    * @param {HTTP.ClientRequest} request
    * @param {HTTP.ServerResponse} response
    */
    delegate(app, request, response) {

      let pathname = url.parse(request.url, true).pathname;

      let route = this.find(pathname);

      if (route) {
        return route.execute(app, request, response);
      }

      response.writeHead(404, {'Content-Type': 'text/plain'});
      response.end('404 Not Found');

    }

  };

  return Router;

})();
