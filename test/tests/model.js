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
        {name: 'age', type: 'int'},
        {name: 'created_at', type: 'datetime'}
      ]
    };
    class Parent extends Nodal.Model {}

    Parent.setDatabase(db);
    Parent.setSchema(schemaParent);

    Parent.validates('name', 'should be at least four characters long', v => v && v.length >= 4);

    let schemaHouse = {
      table: 'houses',
      columns: [
        {name: 'id', type: 'serial'},
        {name: 'material', type: 'string'},
        {name: 'color', type: 'string'},
        {name: 'created_at', type: 'datetime'}
      ]
    };
    class House extends Nodal.Model {}

    House.setDatabase(db);
    House.setSchema(schemaHouse);

    House.joinsTo(Parent);

    before(function(done) {

      db.connect(Nodal.my.Config.db.main);

      db.transaction(
        [schemaParent, schemaHouse].map(schema => {
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
      expect(parent.errorObject().details.name[0]).to.equal('should be at least four characters long');

    });

    it('should not have errors if validations pass', function() {

      let parent = new Parent({name: 'abcd'});
      expect(parent.hasErrors()).to.equal(false);

    });

    it('should clear errors once validated properties set', function() {

      let parent = new Parent();
      expect(parent.hasErrors()).to.equal(true);
      parent.set('name', 'abcdef');
      expect(parent.hasErrors()).to.equal(false);

    });

    it('should toObject with interface', function() {

      let parent = new Parent();
      let obj = parent.toObject();

      expect(obj).to.have.ownProperty('id');
      expect(obj).to.have.ownProperty('name');
      expect(obj).to.have.ownProperty('age');
      expect(obj).to.have.ownProperty('created_at');

      obj = parent.toObject(['id', 'name']);

      expect(obj).to.have.ownProperty('id');
      expect(obj).to.have.ownProperty('name');
      expect(obj).to.not.have.ownProperty('age');
      expect(obj).to.not.have.ownProperty('created_at');

      obj = parent.toObject(['id', 'name'], {exclude: true});

      expect(obj).to.not.have.ownProperty('id');
      expect(obj).to.not.have.ownProperty('name');
      expect(obj).to.have.ownProperty('age');
      expect(obj).to.have.ownProperty('created_at');

    });

    it('should toObject with interface, with joined', function() {

      let parent = new Parent({id: 1});
      let house = new House({id: 1});
      parent.set('house', house);
      house.set('parent', parent);

      let obj = parent.toObject();

      expect(obj).to.have.ownProperty('id');
      expect(obj).to.have.ownProperty('name');
      expect(obj).to.have.ownProperty('age');
      expect(obj).to.have.ownProperty('created_at');
      expect(obj).to.have.ownProperty('house');
      expect(obj.house).to.have.ownProperty('id');
      expect(obj.house).to.have.ownProperty('material');
      expect(obj.house).to.have.ownProperty('color');
      expect(obj.house).to.have.ownProperty('created_at');

      obj = parent.toObject(['id', 'name']);

      expect(obj).to.have.ownProperty('id');
      expect(obj).to.have.ownProperty('name');
      expect(obj).to.not.have.ownProperty('age');
      expect(obj).to.not.have.ownProperty('created_at');
      expect(obj).to.not.have.ownProperty('house');

      obj = parent.toObject(['id', 'name', 'house']);

      expect(obj).to.have.ownProperty('id');
      expect(obj).to.have.ownProperty('name');
      expect(obj).to.not.have.ownProperty('age');
      expect(obj).to.not.have.ownProperty('created_at');
      expect(obj).to.have.ownProperty('house');
      expect(obj.house).to.have.ownProperty('id');
      expect(obj.house).to.have.ownProperty('material');
      expect(obj.house).to.have.ownProperty('color');
      expect(obj.house).to.have.ownProperty('created_at');

      obj = parent.toObject(['id', 'name', {house: ['id', 'material']}]);

      expect(obj).to.have.ownProperty('id');
      expect(obj).to.have.ownProperty('name');
      expect(obj).to.not.have.ownProperty('age');
      expect(obj).to.not.have.ownProperty('created_at');
      expect(obj).to.have.ownProperty('house');
      expect(obj.house).to.have.ownProperty('id');
      expect(obj.house).to.have.ownProperty('material');
      expect(obj.house).to.not.have.ownProperty('color');
      expect(obj.house).to.not.have.ownProperty('created_at');

      obj = parent.toObject(['id', 'name'], {exclude: true});

      expect(obj).to.not.have.ownProperty('id');
      expect(obj).to.not.have.ownProperty('name');
      expect(obj).to.have.ownProperty('age');
      expect(obj).to.have.ownProperty('created_at');
      expect(obj).to.have.ownProperty('house');
      expect(obj.house).to.have.ownProperty('id');
      expect(obj.house).to.have.ownProperty('material');
      expect(obj.house).to.have.ownProperty('color');
      expect(obj.house).to.have.ownProperty('created_at');

      obj = parent.toObject(['id', 'name', 'house'], {exclude: true});

      expect(obj).to.not.have.ownProperty('id');
      expect(obj).to.not.have.ownProperty('name');
      expect(obj).to.have.ownProperty('age');
      expect(obj).to.have.ownProperty('created_at');
      expect(obj).to.not.have.ownProperty('house');

      obj = parent.toObject(['id', 'name', {house: ['id', 'material']}], {exclude: true});

      expect(obj).to.not.have.ownProperty('id');
      expect(obj).to.not.have.ownProperty('name');
      expect(obj).to.have.ownProperty('age');
      expect(obj).to.have.ownProperty('created_at');
      expect(obj).to.have.ownProperty('house');
      expect(obj.house).to.not.have.ownProperty('id');
      expect(obj.house).to.not.have.ownProperty('material');
      expect(obj.house).to.have.ownProperty('color');
      expect(obj.house).to.have.ownProperty('created_at');

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
          model.set('age', 27);
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

    describe('ModelFactory', () => {

      let ParentFactory = new Nodal.ModelFactory(Parent);
      let HouseFactory = new Nodal.ModelFactory(House);

      it('should save all parents', (done) => {

        ParentFactory.create([
          {name: 'Kate'},
          {name: 'Sayid'},
          {name: 'Jack'},
          {name: 'Sawyer'},
        ], (err, models) => {

          if (err) {
            console.log(err);
            process.exit(0);
          }

          let data = ['Kate', 'Sayid', 'Jack', 'Sawyer'];

          expect(models.length).to.equal(4);
          models.forEach(m => data.splice(data.indexOf(m.get('name')), 1));
          expect(data.length).to.equal(0);
          done();

        });

      });

      it('should save data from both Parents and Houses', (done) => {

        Nodal.ModelFactory.createFromModels(
          [Parent, House],
          {
            Parent: [
              {name: 'Hurley'},
              {name: 'Boone'}
            ],
            House: [
              {material: 'straw'},
              {material: 'wood'}
            ]
          },
          (err, results) => {

            expect(err).to.equal(null);
            expect(results.length).to.equal(2);

            let parents = results[0];
            let houses = results[1];

            expect(parents.length).to.equal(2);
            expect(houses.length).to.equal(2);

            done();

          }
        );

      });

    });

  });

});
