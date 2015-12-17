module.exports = (function() {

  "use strict";

  const Nodal = require('nodal');

  class IndexController extends Nodal.Controller {

    get() {
      this.render(this.app.template('index.html'), {
        test: this.params.query.test,
        name: 'My Nodal Application'
      });
    }

  }

  return IndexController;

})();
