'use strict';

module.exports = Nodal => {

  let expect = require('chai').expect;

  describe('Nodal.Model', function() {

    let db = new Nodal.Database();

    let schemaParent = {
      table: 'parents',
      columns: [
        {name: 'id', type: 'serial', properties: {primary_key: true}},
        {name: 'name', type: 'string', properties: { defaultValue: 'Keith'}},
        {name: 'age', type: 'int'},
        {name: 'secret', type: 'string'},
        {name: 'content', type: 'json'},
        {name: 'created_at', type: 'datetime'},
        {name: 'updated_at', type: 'datetime'}
      ]
    };
    class Parent extends Nodal.Model {}
    Parent.hides('secret');

    Parent.setDatabase(db);
    Parent.setSchema(schemaParent);

    Parent.validates('name', 'should be at least four characters long', v => v && v.length >= 4);

    Parent.verifies('should wait 10ms and have age be greater than 0', (name, age, callback) => {
      setTimeout(() => {
        callback(parseInt(age) > 0);
      }, 10);
    });

    let schemaHouse = {
      table: 'houses',
      columns: [
        {name: 'id', type: 'serial'},
        {name: 'material', type: 'string'},
        {name: 'color', type: 'string'},
        {name: 'content', type: 'json'},
        {name: 'created_at', type: 'datetime'},
        {name: 'updated_at', type: 'datetime'}
      ]
    };
    class House extends Nodal.Model {}

    House.setDatabase(db);
    House.setSchema(schemaHouse);

    House.joinsTo(Parent);

    class User extends Nodal.Model {}
    User.setSchema({
      table: 'users',
      columns: [
        {name: 'id', type: 'serial'},
        {name: 'username', type: 'string'}
      ]
    });

    class Post extends Nodal.Model {}
    Post.setSchema({
      table: 'posts',
      columns: [
        {name: 'id', type: 'serial'},
        {name: 'user_id', type: 'int'},
        {name: 'title', type: 'string'},
        {name: 'body', type: 'string'}
      ]
    });
    Post.joinsTo(User, {multiple: true});

    class Comment extends Nodal.Model {}
    Comment.setSchema({
      table: 'comments',
      columns: [
        {name: 'id', type: 'serial'},
        {name: 'post_id', type: 'int'},
        {name: 'body', type: 'string'}      ]
    });
    Comment.joinsTo(Post, {multiple: true});

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

    it('should return default value', function() {

      let parent = new Parent();
      expect(parent.fieldDefaultValue('name')).to.equal('Keith');
      expect(parent.fieldDefaultValue('secret')).to.equal(null);

    });

    it('should toObject with interface', function() {

      let parent = new Parent();
      let obj = parent.toObject();

      expect(obj).to.have.ownProperty('id');
      expect(obj).to.have.ownProperty('name');
      expect(obj).to.have.ownProperty('age');
      expect(obj).to.have.ownProperty('content');
      expect(obj).to.have.ownProperty('created_at');
      expect(obj).to.have.ownProperty('updated_at');
      expect(obj).to.not.have.ownProperty('secret'); // hidden

      obj = parent.toObject(['id', 'name', 'secret']);

      expect(obj).to.have.ownProperty('id');
      expect(obj).to.have.ownProperty('name');
      expect(obj).to.not.have.ownProperty('age');
      expect(obj).to.not.have.ownProperty('content');
      expect(obj).to.not.have.ownProperty('created_at');
      expect(obj).to.not.have.ownProperty('updated_at');
      expect(obj).to.not.have.ownProperty('secret'); // hidden

    });

    it('should toObject with interface, with joined', function() {

      let parent = new Parent({id: 1});
      let house = new House({id: 1});
      parent.setJoined('house', house);
      house.setJoined('parent', parent);

      let obj = parent.toObject();

      expect(obj).to.have.ownProperty('id');
      expect(obj).to.have.ownProperty('name');
      expect(obj).to.have.ownProperty('age');
      expect(obj).to.have.ownProperty('content');
      expect(obj).to.have.ownProperty('created_at');
      expect(obj).to.have.ownProperty('updated_at');
      expect(obj).to.not.have.ownProperty('house');

      obj = parent.toObject(['house']);

      expect(obj).to.have.ownProperty('house');
      expect(obj.house).to.have.ownProperty('id');
      expect(obj.house).to.have.ownProperty('material');
      expect(obj.house).to.have.ownProperty('color');
      expect(obj.house).to.have.ownProperty('content');
      expect(obj.house).to.have.ownProperty('created_at');
      expect(obj.house).to.have.ownProperty('updated_at');

      obj = parent.toObject(['id', 'name']);

      expect(obj).to.have.ownProperty('id');
      expect(obj).to.have.ownProperty('name');
      expect(obj).to.not.have.ownProperty('age');
      expect(obj).to.not.have.ownProperty('content');
      expect(obj).to.not.have.ownProperty('created_at');
      expect(obj).to.not.have.ownProperty('updated_at');
      expect(obj).to.not.have.ownProperty('house');

      obj = parent.toObject(['id', 'name', 'house']);

      expect(obj).to.have.ownProperty('id');
      expect(obj).to.have.ownProperty('name');
      expect(obj).to.not.have.ownProperty('age');
      expect(obj).to.not.have.ownProperty('content');
      expect(obj).to.not.have.ownProperty('created_at');
      expect(obj).to.not.have.ownProperty('updated_at');
      expect(obj).to.have.ownProperty('house');
      expect(obj.house).to.have.ownProperty('id');
      expect(obj.house).to.have.ownProperty('material');
      expect(obj.house).to.have.ownProperty('color');
      expect(obj.house).to.have.ownProperty('content');
      expect(obj.house).to.have.ownProperty('created_at');
      expect(obj.house).to.have.ownProperty('updated_at');

      obj = parent.toObject(['id', 'name', {house: ['id', 'material']}]);

      expect(obj).to.have.ownProperty('id');
      expect(obj).to.have.ownProperty('name');
      expect(obj).to.not.have.ownProperty('age');
      expect(obj).to.not.have.ownProperty('content');
      expect(obj).to.not.have.ownProperty('created_at');
      expect(obj).to.not.have.ownProperty('updated_at');
      expect(obj).to.have.ownProperty('house');
      expect(obj.house).to.have.ownProperty('id');
      expect(obj.house).to.have.ownProperty('material');
      expect(obj.house).to.not.have.ownProperty('color');
      expect(obj.house).to.not.have.ownProperty('content');
      expect(obj.house).to.not.have.ownProperty('created_at');
      expect(obj.house).to.not.have.ownProperty('updated_at');

    });

    it('should toObject with interface from ModelArray', function() {

      let parents = new Nodal.ModelArray(Parent);

      parents.push(new Parent({name: 'Parent'}));

      let obj = parents.toObject(['id', 'name'])
      expect(obj[0]).to.have.ownProperty('id');
      expect(obj[0]).to.have.ownProperty('name');
      expect(obj[0]).to.not.have.ownProperty('age');
      expect(obj[0]).to.not.have.ownProperty('content');
      expect(obj[0]).to.not.have.ownProperty('created_at');
      expect(obj[0]).to.not.have.ownProperty('updated_at');

    });

    it('should toObject with multiply-nested ModelArray', function() {

      let comments = Nodal.ModelArray.from([new Comment({body: 'Hello, World'})]);
      let posts = Nodal.ModelArray.from([new Post({title: 'Hello', body: 'Everybody'})]);
      let users =  Nodal.ModelArray.from([new User({username: 'Ruby'})]);

      posts[0].setJoined('comments', comments);
      users[0].setJoined('posts', posts);

      let obj = users.toObject();

      expect(obj[0].posts).to.not.exist;

      obj = users.toObject(['id', {posts: ['comments']}]);
      expect(obj[0].posts).to.exist;
      expect(obj[0].posts[0].comments).to.exist;


    });

    describe('#save', function() {

      it('should refuse to save with validator error', function(done) {

        let parent = new Parent();
        parent.save(function(err, model) {
          expect(err).to.not.equal(null);
          expect(model).to.equal(parent);
          expect(model.inStorage()).to.equal(false);
          done();
        });

      });

      it('should refuse to save with verifier error', function(done) {

        let parent = new Parent({name: 'abcdef'});
        parent.save(function(err, model) {
          expect(err).to.exist;
          expect(model).to.equal(parent);
          expect(model.inStorage()).to.equal(false);
          done();
        });

      });

      it('should save with no errors', function(done) {

        let parent = new Parent({name: 'abcdef', age: 2});
        parent.save(function(err, model) {
          expect(err).to.equal(null);
          expect(model).to.equal(parent);
          expect(model.inStorage()).to.equal(true);
          done();
        });

      });

      it('should save initially and update afterwards', function(done) {

        let parent = new Parent({name: '123456', age: 2});
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

      it('should create Parent via Parent.create', done => {

        Parent.create({name: 'parent', age: 30}, (err, parent) => {

          expect(err).to.not.exist;
          expect(parent).to.exist;
          done();

        });

      });

      it('should create Parent via Parent.create, destroy via Parent.destroy', done => {

        Parent.create({name: 'parent', age: 30}, (err, parent) => {

          expect(err).to.not.exist;
          expect(parent).to.exist;

          Parent.destroy(parent.get('id'), (err, parent) => {

            expect(err).to.not.exist;
            expect(parent.inStorage()).to.equal(false);
            done();

          });

        });

      });

      it('should create Parent via Parent.create, find by Parent.find', done => {

        Parent.create({name: 'parent', age: 30}, (err, parent) => {

          expect(err).to.not.exist;
          expect(parent).to.exist;

          Parent.find(parent.get('id'), (err, parent) => {

            expect(err).to.not.exist;
            expect(parent.inStorage()).to.equal(true);
            done();

          });

        });

      });

      it('should create Parent via Parent.create, find by Parent.findBy', done => {

        Parent.create({name: 'parent_findby', age: 30}, (err, parent) => {

          expect(err).to.not.exist;
          expect(parent).to.exist;

          Parent.findBy('name', 'parent_findby', (err, parent) => {

            expect(err).to.not.exist;
            expect(parent.inStorage()).to.equal(true);
            done();

          });

        });

      });

      it('Should create via findOrCreateBy', done => {

        Parent.findOrCreateBy('name', {name: 'parent_unique', age: 30}, (err, parent) => {

          expect(err).to.not.exist;
          expect(parent).to.exist;
          done();

        });

      });

      it('Should find via findOrCreateBy', done => {

        Parent.create({name: 'parent_unique_2', age: 30}, (err, parent) => {

          expect(err).to.not.exist;
          expect(parent).to.exist;

          Parent.findOrCreateBy('name', {name: 'parent_unique_2', age: 30}, (err, parent) => {

            expect(err).to.not.exist;
            expect(parent).to.exist;
            done();

          });

        });

      });

      it('should save multiple parents', function(done) {

        let parents = new Nodal.ModelArray(Parent);

        for (let i = 0; i < 10; i++) {
          parents.push(new Parent({name: 'Parent_' + i, age: 20}));
        }

        parents.saveAll((err, modelArray) => {
          expect(err).to.equal(null);
          expect(modelArray.filter(m => m.inStorage()).length).to.equal(modelArray.length);
          done();
        });

      });

    });

    it('should delete multiple parents', (done) => {

      Parent.query()
        .end((err, parents) => {

          parents.destroyAll((err) => {

            parents.forEach((parent) => {
              expect(parent.inStorage()).to.equal(false);
            });

            done();

          });

        });

    });

    describe('ModelFactory', () => {

      let ParentFactory = new Nodal.ModelFactory(Parent);
      let HouseFactory = new Nodal.ModelFactory(House);

      it('should not save all parents with verification errors', (done) => {

        ParentFactory.create([
          {name: 'Kate'},
          {name: 'Sayid'},
          {name: 'Jack'},
          {name: 'Sawyer'},
        ], (err, models) => {

          expect(err).to.exist;
          done();

        });

      });

      it('should save all parents', (done) => {

        ParentFactory.create([
          {name: 'Kate', age: 20},
          {name: 'Sayid', age: 20},
          {name: 'Jack', age: 20},
          {name: 'Sawyer', age: 20},
        ], (err, models) => {

          expect(err).to.not.exist;

          let data = ['Kate', 'Sayid', 'Jack', 'Sawyer'];

          expect(models.length).to.equal(4);
          models.forEach(m => data.splice(data.indexOf(m.get('name')), 1));
          expect(data.length).to.equal(0);
          done();

        });

      });

      it('should not save data from both Parents and Houses with verification errors', (done) => {

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

            expect(err).to.exist;
            done();

          }
        );

      });

      it('should save data from both Parents and Houses', (done) => {

        Nodal.ModelFactory.createFromModels(
          [Parent, House],
          {
            Parent: [
              {name: 'Hurley', age: 20},
              {name: 'Boone', age: 20}
            ],
            House: [
              {material: 'straw'},
              {material: 'wood'}
            ]
          },
          (err, results) => {

            expect(err).to.not.exist;
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

};
