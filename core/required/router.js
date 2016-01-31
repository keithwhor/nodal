module.exports = (() => {

  'use strict';

  const url = require('url');
  const querystring = require('querystring');
  const domain = require('domain'); // TODO: Will be deprecated

  const utilities = require('./utilities.js');

  const ExecutionQueue = require('./execution_queue.js');

  class Route {

    constructor(path, regex, names) {

      this.path = path;
      this.regex = regex;
      this.names = names;
      this.controller = '';

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

    find(path) {

      let routes = this._routes;

      for (let i = 0, len = routes.length; i < len; i++) {
        let route = routes[i];
        if (path.match(route.regex)) {
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

    parse(args) {

      return {
        remoteAddress: args[0],
        url: args[1],
        method: args[2],
        path: args[3],
        controller: args[4],
        headers: args.slice(args.indexOf('--headers') + 1, args.indexOf('--matches'))
          .reduce((obj, v, i, arr) => {
            (i & 1) && (obj[arr[i - 1]] = v);
            return obj;
          }, {}),
        matches: args.slice(args.indexOf('--matches') + 1, args.indexOf('--route')),
        route: args.slice(args.indexOf('--route') + 1, args.indexOf('--body'))
          .reduce((obj, v, i, arr) => {
            (i & 1) && (obj[arr[i - 1]] = v);
            return obj;
          }, {}),
        body: args[args.indexOf('--body') + 1]
      };

    }

    dispatch(routeData, responder) {

      let params = {
        buffer: new Buffer(routeData.body, 'binary'),
        query: this.parseQueryParameters(url.parse(routeData.url, true).query),
        body: this.parseBody(routeData.body, routeData.headers),
        path: routeData.path,
        matches: routeData.matches,
        route: routeData.route,
        remoteAddress: routeData.headers['x-forwarded-for'] || routeData.remoteAddress,
        id: routeData.route.id
      };

      let d = domain.create();

      d.on('error', responder);

      d.run(() => {

        const DispatchController = require(`${process.cwd()}/app/controllers/${routeData.controller}`);

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
