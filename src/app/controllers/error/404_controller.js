module.exports = (function() {

  "use strict";

  const Nodal = require('nodal');

  class Error404Controller extends Nodal.Controller {

    get() {

      this.status(404);

      this.render(
        this.app.template('error/404.html').generate(this.params)
      );

    }

  }

  return Error404Controller;

})();
