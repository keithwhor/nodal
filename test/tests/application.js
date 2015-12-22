module.exports = (function(Nodal) {

  "use strict";

  let expect = require('chai').expect;

  describe('Nodal.Application', function() {

    let app = new Nodal.Application();
    let db = new Nodal.Database();

    before(function() {

      db.connect(Nodal.my.Config.db.main);

    });

    after(function(done) {

      db.close(function() {
        done();
      });

    });

    describe('#useDatabase', function() {

      it('Should successfully associate db with alias "main"', function() {

        expect(app.useDatabase(db, 'main')).to.equal(true);

      });

    });

    describe('#db', function() {

      it('Should have a database accessible using alias "main"', function() {

        expect(app.db('main')).to.be.instanceof(Nodal.Database);

      });

    });

  });

});
