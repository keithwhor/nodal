"use strict";

module.exports = function(Nodal, app) {

  let expect = require('chai').expect;

  describe('#composer', function() {

    it('should be an object', function() {
      expect(app.composer).to.be.an('object');
    });

    it('should have the constructor name "Composer"', function() {
      expect(app.composer.constructor.name).to.equal('Composer');
    });

  });

};
