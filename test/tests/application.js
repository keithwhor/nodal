module.exports = (function(Nodal) {

  "use strict";

  let expect = require('chai').expect;

  describe('Nodal.Application', function() {

    let app = new Nodal.Application();

    after(function() {

      app.db('main') && app.db('main').close();

    });

    describe('#useDatabase', function() {

      it('Should successfully connect to database from my.Config', function() {

        expect(app.useDatabase('main', Nodal.my.Config.db.main)).to.equal(true);

      });

    });

    describe('#db', function() {

      it('Should have a database accessible using alias "main"', function() {

        expect(app.db('main')).to.be.instanceof(Nodal.Database);

      });

    });

    describe('#composer', function() {

      it('should be an object', function() {
        expect(app.composer).to.be.an('object');
      });

      it('should have the constructor name "Composer"', function() {
        expect(app.composer).to.be.instanceof(Nodal.Composer);
      });

    });

  });

});
