module.exports = (function(Nodal) {

  "use strict";

  let expect = require('chai').expect;

  describe('Nodal.Model', function() {

    let db = new Nodal.Database();
    let schema = {
      table: 'test_objects',
      columns: [
        {name: 'id', type: 'serial'},
        {name: 'test', type: 'string'},
        {name: 'created_at', type: 'datetime'}
      ]
    };

    class TestObject extends Nodal.Model {

      __preInitialize__() {

        this.validates('test', 'should be at least five characters long', function(value) {

          return value && value.length && value.length >= 5;

        });

      }

    }

    TestObject.prototype.schema = schema;

    TestObject.prototype.externalInterface = ['id', 'test', 'created_at'];

    before(function(done) {

      db.connect(Nodal.my.Config.db.main);

      db.transaction(
        db.adapter.generateCreateTableQuery(schema.table, schema.columns),
        function(err, result) {
          expect(err).to.equal(null);
          done();
        }
      );

    });

    after(function(done) {

      db.close(function() {
        done();
      });

    });


    it('should instantiate', function() {

      let testObject = new TestObject();
      expect(testObject).to.be.instanceof(Nodal.Model);

    });

    it('should not be listed as in Storage', function() {

      let testObject = new TestObject();
      expect(testObject.inStorage()).to.equal(false);

    });

    it('should have errors from validators with no params set', function() {

      let testObject = new TestObject();
      expect(testObject.hasErrors()).to.equal(true);

    });

    it('should have correct validator error', function() {

      let testObject = new TestObject();
      expect(testObject.errorObject()).to.not.equal(null);
      expect(testObject.errorObject().details).to.have.property('test');
      expect(testObject.errorObject().details.test[0]).to.equal('should be at least five characters long');

    });

    it('should not have errors if validations pass', function() {

      let testObject = new TestObject({test: 'abcdef'});
      expect(testObject.hasErrors()).to.equal(false);

    });

    it('should clear errors once validated properties set', function() {

      let testObject = new TestObject();
      expect(testObject.hasErrors()).to.equal(true);
      testObject.set('test', 'abcdef');
      expect(testObject.hasErrors()).to.equal(false);

    });

    describe('#save', function() {

      it('should refuse to save with error', function(done) {

        let testObject = new TestObject();
        testObject.save(db, function(err, model) {
          expect(err).to.not.equal(null);
          expect(model).to.equal(testObject);
          expect(model.inStorage()).to.equal(false);
          done();
        });

      });

      it('should save with no errors', function(done) {

        let testObject = new TestObject({test: 'abcdef'});
        testObject.save(db, function(err, model) {
          expect(err).to.equal(null);
          expect(model).to.equal(testObject);
          expect(model.inStorage()).to.equal(true);
          done();
        });

      });

      it('should save initially and update afterwards', function(done) {

        let testObject = new TestObject({test: '123456'});
        testObject.save(db, function(err, model) {
          expect(err).to.equal(null);
          model.set('test', 'infinity');
          model.save(db, function(err, model) {
            expect(err).to.equal(null);
            done();
          });
        });

      });

    });

  });

});
