module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');

  class IndexController extends Nodal.Controller {

    constructor() {
      super();
    }

    get(self, params, app) {
      self.render(app.template('index'), params);
    }

  }

  return IndexController;

})();
