"use strict";

module.exports = function(Nodal, app) {

  let expect = require('chai').expect;

  after(function() {

    app.db('main') && app.db('main').close();

  });

  describe('#addDatabase', function() {

    it('Should successfully connect to database from my.Config', function() {

      expect(app.addDatabase('main', Nodal.my.Config.db.main)).to.equal(true);

    });

  });

  describe('#db', function() {

    it('Should have a database accessible using alias "main"', function() {

      expect(app.db('main')).to.be.instanceof(Nodal.Database);

    });

  });

};
