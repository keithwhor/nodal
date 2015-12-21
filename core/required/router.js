"use strict";

module.exports = (function() {

  const url = require('url');
  const qs = require('querystring');
  // const Config = require('../module.js'.my.Config); // ?

  const Controller = require('./controller.js');

  class Route {

    constructor(regex, controller) {
      this._regex = null;
      if(typeof regex === 'string') {
        this._regex = new RegExp(regex);
      } else if(regex instanceof RegExp) {
        this._regex = regex;
      } else {
        throw new Error('Routes must be strings or valid regular expression');
      }
      if(!Controller.prototype.isPrototypeOf(controller.prototype)) {
        throw new Error('Route requires a valid Controller');
      }
      this._controller = controller;
    }

    match(pathname) {
      return !!this._regex.exec(pathname);
    }

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

    execute(request, response, urlParts, app) {

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

        controller.authorize = app.authorizer ? app.authorizer.exec.bind(
            app.authorizer,
            controller,
            params,
            app
          ) : ((permissionName, callback) => { callback(null); });

        // Enjoy this one ;)
        //      ... just to be sassy
        let method = ({
          'GET': ['index', 'show'],
          'PUT': ['put', 'update'],
          'POST': ['create', 'create'],
          'DELETE': ['destroy', 'destroy'],
          'OPTIONS': ['options', 'options']
        }[request.method] || ['index', 'index'])[(id !== null) | 0];

        controller[method](controller, controller, params, app);

      });

      return true;

    }

  }

  class Router {

    constructor() {
      this._routes = [];
    }

    route(regex, Controller) {
      this._routes.push(new Route(regex, Controller));
    }

    find(pathname) {
      let routes = this._routes;
      for(let i = 0, len = routes.length; i < len; i++) {
        if(routes[i].match(pathname)) {
          return routes[i];
        }
      }
      return null;
    }

    delegate(app, request, response) {

      let urlParts = url.parse(request.url, true);

      let route = this.find(urlParts.pathname);
      if (route) {
        return route.execute(request, response, urlParts, app);
      }

      response.writeHead(404, {'Content-Type': 'text/plain'});
      response.end('404 Not Found');

    }

  };

  return Router;

})();
