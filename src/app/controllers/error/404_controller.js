module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');

  class Error404Controller extends Nodal.Controller {

    constructor() {
      super();
    }

    get(self, params, app) {
      self.status(404);
      self.render(app.template('error/404'), params);
    }

  }

  return Error404Controller;

})();
