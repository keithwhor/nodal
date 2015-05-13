"use strict";

module.exports = (function(Nodal) {

  let expect = require('chai').expect;

  describe('Nodal.Application', function() {

    let app = new Nodal.Application();

    require('./application/db.js')(Nodal, app);

    require('./application/composer.js')(Nodal, app);

  });

});
