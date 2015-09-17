module.exports = (function() {

  "use strict";

  const Nodal = require('nodal');

  /* Import Database */
  // const db = Nodal.require('db/main.js');

  class WorkerApp extends Nodal.Application {

    __setup__() {

      /* Database */
      // this.useDatabase(db, 'main');

    }

  }

  return WorkerApp;

})();
