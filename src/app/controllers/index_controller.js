"use strict";

module.exports = (function() {

  const Nodal = require('nodal');

  class IndexController extends Nodal.Controller {

    constructor() {
      super();
    }

    get(self, params, app) {
      self.render(app.template('index.html'), params);
    }

  }

  return IndexController;

})();
