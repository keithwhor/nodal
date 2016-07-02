'use strict';

module.exports = Nodal => {

  let expect = require('chai').expect;

  describe('Nodal', function(){

    it('should exist', function() {

      expect(Nodal).to.be.an('object');

    });

    it('should have "API" object', function() {

      expect(Nodal.API).to.be.an('object');

    });

    it('should have Application constructor', function() {

      expect(Nodal.Application).to.be.a('function');

    });

    it('should have Controller constructor', function() {

      expect(Nodal.Controller).to.be.a('function');

    });

    it('should have Database constructor', function() {

      expect(Nodal.Database).to.be.a('function');

    });

    it('should have Migration constructor', function() {

      expect(Nodal.Migration).to.be.a('function');

    });

    it('should have Model constructor', function() {

      expect(Nodal.Model).to.be.a('function');

    });

    it('should have Router constructor', function() {

      expect(Nodal.Router).to.be.a('function');

    });

    it('should have SchemaGenerator constructor', function() {

      expect(Nodal.SchemaGenerator).to.be.a('function');

    });

    it('should have require method', function() {

      expect(Nodal.require).to.be.a('function');

    });

    it('should have "include" object', function() {

      expect(Nodal.include).to.be.an('object');

    });

    it('should have "my" object', function() {

      expect(Nodal.my).to.be.an('object');

    });

  });

};
