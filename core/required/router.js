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

    match(path) {

      let match = path.match(this.regex);
      return match ? [].slice.call(match, 1) : null;

    }

    params(path) {

      let matches = this.match(path).map(v => v || '');
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

    parsePath(requrl) {

      let urlData = url.parse(requrl, true);
      let path = urlData.pathname;
      if (path[path.length - 1] === '/') {
        path = path.substr(path, path.length - 1);
      }

      return path;

    }

    route(path) {

      let routeData = utilities.parseRegexFromString(path);
      let route = new Route(path, routeData.regex, routeData.names);
      this._routes.push(route);
      return route;

    }

    find(url) {

      let path = this.parsePath(url);
      let routes = this._routes;

      for (let i = 0, len = routes.length; i < len; i++) {
        let route = routes[i];
        if (route.match(path)) {
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
          return this.parseQueryParameters(querystring.parse(body.toString()));
        },
        'application/json': body => {
          try {
            return JSON.parse(body.toString());
          } catch(e) {
            console.log('Failed to parse JSON Body');
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

    parseAuth(params, headers) {

      let auth = {};

      if (headers['authorization']) {
        let parts = headers['authorization'].split(' ');
        if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
            auth.token_type = 'bearer';
            auth.access_token = parts[1];
        }
      } else if (params.access_token) {
        auth.token_type = 'bearer';
        auth.access_token = params.access_token || '';
      }

      return auth;
    }

    prepare(ip, url, method, headers, body) {

      let path = this.parsePath(url);
      let route = this.find(url);
      body = body instanceof Buffer ? body : new Buffer(body + '');

      return {
        remoteAddress: ip,
        url: url,
        method: method,
        path: path,
        controller: route.controller,
        headers: headers,
        matches: route.match(path),
        route: route.params(path),
        body: body
      };

    }

    parseRemoteAddress(remoteAddress, list) {

      let remoteAddressList = remoteAddress.split(',').map(v => v.replace(/^\s*(.*?)\s*$/, '$1')).filter(v => v);
      return list ? remoteAddressList : remoteAddressList[0];

    }

    dispatch(routeData, responder) {

      let params = {
        buffer: new Buffer(routeData.body, 'binary'),
        query: new StrongParam(this.parseQueryParameters(url.parse(routeData.url, true).query)),
        body: new StrongParam(this.parseBody(routeData.body, routeData.headers)),
        path: routeData.path,
        auth: this.parseAuth(url.parse(routeData.url, true).query, routeData.headers),
        matches: routeData.matches,
        route: routeData.route,
        remoteAddress: this.parseRemoteAddress(routeData.headers['x-forwarded-for'] || routeData.remoteAddress),
        remoteAddressList: this.parseRemoteAddress(routeData.headers['x-forwarded-for'] || routeData.remoteAddress, true),
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

        controller.run();

        return controller;

      });

    }

  }

  return Router;

})();
