module.exports = (function(Nodal) {

  "use strict";

  let expect = require('chai').expect;

  describe('Nodal.Model', function() {

    let db = new Nodal.Database();

    let schemaParent = {
      table: 'parents',
      columns: [
        {name: 'id', type: 'serial'},
        {name: 'name', type: 'string'},
        {name: 'created_at', type: 'datetime'}
      ]
    };
    class Parent extends Nodal.Model {}

    Parent.setDatabase(db);
    Parent.setSchema(schemaParent);

    Parent.validates('name', 'should be at least five characters long', v => v && v.length >= 5);

    before(function(done) {

      db.connect(Nodal.my.Config.db.main);

      db.transaction(
        [schemaParent].map(schema => {
          return db.adapter.generateCreateTableQuery(schema.table, schema.columns);
        }).join(';'),
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

      let parent = new Parent();
      expect(parent).to.be.instanceof(Nodal.Model);

    });

    it('should not be listed as in Storage', function() {

      let parent = new Parent();
      expect(parent.inStorage()).to.equal(false);

    });

    it('should have errors from validators with no params set', function() {

      let parent = new Parent();
      expect(parent.hasErrors()).to.equal(true);

    });

    it('should have correct validator error', function() {

      let parent = new Parent();
      expect(parent.errorObject()).to.not.equal(null);
      expect(parent.errorObject().details).to.have.property('name');
      expect(parent.errorObject().details.name[0]).to.equal('should be at least five characters long');

    });

    it('should not have errors if validations pass', function() {

      let parent = new Parent({name: 'abcdef'});
      expect(parent.hasErrors()).to.equal(false);

    });

    it('should clear errors once validated properties set', function() {

      let parent = new Parent();
      expect(parent.hasErrors()).to.equal(true);
      parent.set('name', 'abcdef');
      expect(parent.hasErrors()).to.equal(false);

    });

    describe('#save', function() {

      it('should refuse to save with error', function(done) {

        let parent = new Parent();
        parent.save(function(err, model) {
          expect(err).to.not.equal(null);
          expect(model).to.equal(parent);
          expect(model.inStorage()).to.equal(false);
          done();
        });

      });

      it('should save with no errors', function(done) {

        let parent = new Parent({name: 'abcdef'});
        parent.save(function(err, model) {
          expect(err).to.equal(null);
          expect(model).to.equal(parent);
          expect(model.inStorage()).to.equal(true);
          done();
        });

      });

      it('should save initially and update afterwards', function(done) {

        let parent = new Parent({name: '123456'});
        parent.save(function(err, model) {
          expect(err).to.equal(null);
          model.set('name', 'infinity');
          model.save(function(err, model) {
            expect(err).to.equal(null);
            done();
          });
        });

      });

      it('should save multiple parents', function(done) {

        let parents = new Nodal.ModelArray(Parent);

        for (let i = 0; i < 10; i++) {
          parents.push(new Parent({name: 'Parent_' + i}));
        }

        parents.saveAll((err, modelArray) => {
          expect(err).to.equal(null);
          expect(modelArray.filter(m => m.inStorage()).length).to.equal(modelArray.length);
          done();
        });

      });

    });

  });

});
