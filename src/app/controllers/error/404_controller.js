module.exports = (function() {

  "use strict";

  const Nodal = require('nodal');

  class Error404Controller extends Nodal.Controller {

    get() {

      this.status(404);

      this.render(
        Nodal.Template.generate('error/404.html').render(this.params)
      );

    }

  }

  return Error404Controller;

})();
