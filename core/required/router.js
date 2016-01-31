module.exports = (() => {

  'use strict';

  const url = require('url');
  const querystring = require('querystring');

  const utilities = require('./utilities.js');

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

  }

  return Router;

})();
