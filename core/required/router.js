module.exports = (function() {

  var url = require('url');
  var qs = require('querystring');
  var Config = require('../module.js').my.Config;

  var Controller = require('./controller.js');

  function Route(regex, controller) {
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

  Route.prototype.match = function(pathname) {
    var matches = this._regex.exec(pathname);
    return !!matches && matches[0] === pathname;
  };

  Route.prototype.parseQueryParameters = function(query) {

    var obj = {};

    Object.keys(query).forEach(function(key) {

      var newKey, subKey;
      var value = query[key];
      var match = key.match(/(.*)\[(.*)\]$/);

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

  };

  Route.prototype.parseBody = function(contentType, body) {

    var fn = {
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

  };

  Route.prototype.execute = function(request, response, urlParts, app) {

    var controller = new this._controller(request, response, app.middleware);

    var body = '';
    var query = this.parseQueryParameters(urlParts.query);
    var path = [].slice.call(urlParts.pathname.match(this._regex), 0);
    var method = {
      'GET': 'get',
      'PUT': 'put',
      'POST': 'post',
      'DELETE': 'del'
    }[request.method] || 'get';

    request.on('data', function(data) {
      body += data;
      if (body.length > 1e6) {
        request.connection.destroy();
      }
    });

    var headers = {};
    Object.keys(request.headers).forEach(function(key) {
      headers[key] = request.headers[key];
    });

    request.on('end', (function() {

      var params = {
        path: path,
        query: query,
        body: this.parseBody(headers['content-type'], body),
        ip_address: headers['x-forwarded-for'] || request.connection.remoteAddress,
        headers: headers
      };

      controller.auth(
        controller,
        params,
        app,
        function(authorized, reason) {
          return authorized ?
            controller[method](controller, params, app) :
            controller.unauthorized(reason);
        }
      );

    }).bind(this));

    return true;

  };

  function Router() {
    this._routes = [];
  }

  Router.prototype.route = function(regex, Controller) {
    this._routes.push(new Route(regex, Controller));
  };

  Router.prototype.find = function(pathname) {
    var routes = this._routes;
    for(var i = 0, len = routes.length; i < len; i++) {
      if(routes[i].match(pathname)) {
        return routes[i];
      }
    }
    return null;
  };

  Router.prototype.delegate = function(app, request, response) {

    var urlParts = url.parse(request.url, true);

    var route = this.find(urlParts.pathname);
    if (route) {
      return route.execute(request, response, urlParts, app);
    }

    response.writeHead(404, {'Content-Type': 'text/plain'});
    response.end('404 Not Found');

  };

  return Router;

})();
