var Nodal = require('../../core/module.js');
var expect = require('chai').expect;

describe('Nodal.Application', function() {

  var app = new Nodal.Application();

  require('./application/composer.js')(app);

});
