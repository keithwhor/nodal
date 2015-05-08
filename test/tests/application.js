module.exports = (function(Nodal) {

  var expect = require('chai').expect;

  describe('Nodal.Application', function() {

    var app = new Nodal.Application();

    require('./application/db.js')(Nodal, app);

    require('./application/composer.js')(Nodal, app);

  });

});
