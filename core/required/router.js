module.exports = (() => {

  'use strict';

  const url = require('url');
  const querystring = require('querystring');
  const domain = require('domain'); // TODO: Will be deprecated

  const utilities = require('./utilities.js');
  const StrongParam = require('./strong_param.js');
  const ExecutionQueue = require('./execution_queue.js');

  class Route {

    constructor(path, regex, names) {

      this.path = path;
      this.regex = regex;
      this.names = names;
      this.controller = null;

    }

    parsePath(requrl) {

      let urlData = url.parse(requrl, true);
      let path = urlData.pathname;
      if (path[path.length - 1] === '/') {
        path = path.substr(path, path.length - 1);
      }

      return path;

    }

    match(requrl) {

      let match = this.parsePath(requrl).match(this.regex);
      return match ? [].slice.call(match, 1) : null;

    }

    params(requrl) {

      let matches = this.match(requrl).slice(1).map(v => v || '');
      return this.names.reduce((obj, name, i) => {
        obj[name] = matches[i];
        return obj;
      }, {});

    }

    use(controller) {

      this.controller = controller;
      return this;

    }

  }

  class Router {

    constructor() {

      this._routes = [];
      this.middleware = new ExecutionQueue();
      this.renderware = new ExecutionQueue();

    }

    route(path) {

      let routeData = utilities.parseRegexFromString(path);
      let route = new Route(path, routeData.regex, routeData.names);
      this._routes.push(route);
      return route;

    }

    find(url) {

      let routes = this._routes;

      for (let i = 0, len = routes.length; i < len; i++) {
        let route = routes[i];
        if (route.match(url)) {
          return route;
        }
      }

      return null;

    }

    parseBody(body, headers) {

      let contentType = headers['content-type'];
      contentType = (typeof contentType === 'string') ? contentType.split(';')[0] : '';

      let fn = {
        'application/x-www-form-urlencoded': (body) => {
          return this.parseQueryParameters(querystring.parse(body));
        },
        'application/json': body => {
          try {
            return JSON.parse(body);
          } catch(e) {
            return {};
          }
        }
      }[contentType];

      return fn ? fn.call(this, body) : {};

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

    prepare(ip, url, method, headers, body) {

      let route = this.find(url);
      body = body instanceof Buffer ? body : new Buffer(body + '');

      return {
        remoteAddress: ip,
        url: url,
        method: method,
        path: route.parsePath(url),
        controller: route.controller,
        headers: headers,
        matches: route.match(url),
        route: route.params(url),
        body: body
      };

    }

    dispatch(routeData, responder) {

      let params = {
        buffer: new Buffer(routeData.body, 'binary'),
        query: new StrongParam(this.parseQueryParameters(url.parse(routeData.url, true).query)),
        body: new StrongParam(this.parseBody(routeData.body, routeData.headers)),
        path: routeData.path,
        matches: routeData.matches,
        route: routeData.route,
        remoteAddress: routeData.headers['x-forwarded-for'] || routeData.remoteAddress,
        id: routeData.route.id
      };

      let d = domain.create();

      d.on('error', responder);

      d.run(() => {

        const DispatchController = routeData.controller;

        let controller = new DispatchController(
          routeData.path,
          routeData.method,
          routeData.headers,
          params,
          responder
        );

        controller.middleware.prepend(this.middleware);
        controller.renderware.append(this.renderware);

        controller.run(routeData.method, params.id);

        return controller;

      });

    }

  }

  return Router;

})();
