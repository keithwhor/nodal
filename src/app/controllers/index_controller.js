module.exports = (function() {

  "use strict";

  const Nodal = require('nodal');

  class IndexController extends Nodal.Controller {

    get(self, params, app) {
      self.render(app.template('index.html'), params);
    }

  }

  return IndexController;

})();
