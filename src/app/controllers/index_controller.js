module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');

  class IndexController extends Nodal.Controller {

    get() {

      this.render(
        this.app.template('layout.html', 'index.html').generate(
          this.params,
          {
            test: this.params.query.test,
            name: 'My Nodal Application'
          }
        )
      );

    }

  }

  return IndexController;

})();
