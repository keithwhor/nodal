'use strict';

module.exports = Nodal => {

  const async = require('async');

  let expect = require('chai').expect;

  describe('Nodal.Composer', function() {

    let db = new Nodal.Database();

    let schemaParent = {
      table: 'parents',
      columns: [
        {name: 'id', type: 'serial'},
        {name: 'name', type: 'string'},
        {name: 'shirt', type: 'string'},
        {name: 'hidden', type: 'string'},
        {name: 'pantaloons', type: 'string'},
        {name: 'created_at', type: 'datetime'},
        {name: 'updated_at', type: 'datetime'}
      ]
    };

    let schemaFriendship = {
      table: 'friendships',
      columns: [
        {name: 'id', type: 'serial'},
        {name: 'from_parent_id', type: 'int'},
        {name: 'to_parent_id', type: 'int'},
        {name: 'created_at', type: 'datetime'},
        {name: 'updated_at', type: 'datetime'}
      ]
    };

    let schemaChild = {
      table: 'children',
      columns: [
        {name: 'id', type: 'serial'},
        {name: 'parent_id', type: 'int'},
        {name: 'name', type: 'string'},
        {name: 'age', type: 'int'},
        {name: 'created_at', type: 'datetime'},
        {name: 'updated_at', type: 'datetime'}
      ]
    };

    let schemaPartner = {
      table: 'partners',
      columns: [
        {name: 'id', type: 'serial'},
        {name: 'parent_id', type: 'int'},
        {name: 'name', type: 'string'},
        {name: 'job', type: 'string'},
        {name: 'created_at', type: 'datetime'},
        {name: 'updated_at', type: 'datetime'}
      ]
    };

    let schemaPet = {
      table: 'pets',
      columns: [
        {name: 'id', type: 'serial'},
        {name: 'parent_id', type: 'int'},
        {name: 'name', type: 'string'},
        {name: 'animal', type: 'string'},
        {name: 'details', type: 'json'},
        {name: 'created_at', type: 'datetime'},
        {name: 'updated_at', type: 'datetime'}
      ]
    };

    class Parent extends Nodal.Model {}

    Parent.setDatabase(db);
    Parent.setSchema(schemaParent);
    Parent.hides('hidden');

    class Friendship extends Nodal.Model {}

    Friendship.setDatabase(db);
    Friendship.setSchema(schemaFriendship);
    Friendship.joinsTo(Parent, {name: 'fromParent', as: 'outgoingFriendships', multiple: true});
    Friendship.joinsTo(Parent, {name: 'toParent', as: 'incomingFriendships', multiple: true});

    class Child extends Nodal.Model {}

    Child.setDatabase(db);
    Child.setSchema(schemaChild);
    Child.joinsTo(Parent, {multiple: true});

    class Partner extends Nodal.Model {}

    Partner.setDatabase(db);
    Partner.setSchema(schemaPartner);
    Partner.joinsTo(Parent);

    class Pet extends Nodal.Model {}

    Pet.setDatabase(db);
    Pet.setSchema(schemaPet);
    Pet.joinsTo(Parent, {multiple: true});

    before(function(done) {

      db.connect(Nodal.my.Config.db.main);

      db.transaction(
        [schemaParent, schemaFriendship, schemaChild, schemaPartner, schemaPet].map(schema => {
          return [
            db.adapter.generateDropTableQuery(schema.table, true),
            db.adapter.generateCreateTableQuery(schema.table, schema.columns)
          ].join(';');
        }).join(';'),
        function(err, result) {

          expect(err).to.equal(null);

          let parents = [
            'Albert',
            'Derek',
            'Dingleberry',
            'James',
            'Joe',
            'Sally',
            'Samantha',
            'Samuel',
            'Suzy',
            'Zoolander'
          ].map((name, i) => new Parent({
            name: name,
            shirt: ['red', 'green', 'blue'][i % 3],
            pantaloons: ['jeans', 'shorts'][i % 2],
            hidden: 'abcdef'.split('')[i % 6]
          }));

          parents = Nodal.ModelArray.from(parents);

          parents.forEach((p, i) => {

            let id = i + 1;

            let children = 'ABCDEFGHIJ'.split('').map(name => {
              return new Child({parent_id: id, name: `Child${name}`, age: (Math.random() * 30) | 0});
            });

            p.setJoined('children', Nodal.ModelArray.from(children));

            let pets = ['Oliver', 'Ruby', 'Pascal'].map((name, i) => {
              return new Pet({parent_id: id, name: name, animal: ['Cat', 'Dog', 'Cat'][i], details: { language: name === 'Pascal' }});
            });

            p.setJoined('pets', Nodal.ModelArray.from(pets));

            let partner = new Partner({parent_id: id, name: `Partner${i}`, job: ['Plumber', 'Engineer', 'Nurse'][(Math.random() * 3) | 0]});
            p.setJoined('partner', partner);

            let friendships = new Nodal.ModelArray(Friendship);
            while (i--) {
              let friendship = new Friendship({from_parent_id: id, to_parent_id: i + 1});
              friendships.push(friendship);
            }

            p.setJoined('outgoingFriendships', friendships);

          });

          parents.saveAll(err => {

            expect(err).to.equal(null);

            async.series(
              [].concat(
                parents.map(p => p.joined('children').saveAll.bind(p.joined('children'))),
                parents.map(p => p.joined('pets').saveAll.bind(p.joined('pets'))),
                parents.map(p => p.joined('partner').save.bind(p.joined('partner'))),
                parents.map(p => p.joined('outgoingFriendships').saveAll.bind(p.joined('outgoingFriendships'))).filter(p => p)
              ), (err) => {

                expect(err).to.not.exist;
                done();

              }
            );

          });

        }
      );

    });

    after(function(done) {

      db.close(function() {
        done();
      });

    });

    it('Should query all parents (10)', function(done) {

      Parent.query()
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents).to.be.an.instanceOf(Nodal.ModelArray);
          expect(parents.length).to.equal(10);
          done();

        });

    });

    it('Should query all partners (10)', function(done) {

      Partner.query()
        .end((err, partners) => {

          expect(err).to.equal(null);
          expect(partners).to.be.an.instanceOf(Nodal.ModelArray);
          expect(partners.length).to.equal(10);
          done();

        });

    });

    it('Should query all Children (100)', function(done) {

      Child.query()
        .end((err, children) => {

          expect(err).to.equal(null);
          expect(children).to.be.an.instanceOf(Nodal.ModelArray);
          expect(children.length).to.equal(100);
          done();

        });

    });

    it('Should have parent lazy load models after fetching', (done) => {

      Parent.query()
        .limit(1)
        .end((err, parents) => {

          let parent = parents[0];

          expect(err).to.equal(null);
          expect(parent.joined('children')).to.be.undefined;
          expect(parent.joined('partner')).to.be.undefined;

          parent.include((err, children, partner) => {

            expect(err).to.equal(null);
            expect(children.length).to.equal(10);
            expect(partner).to.exist;
            expect(parent.joined('children')).to.equal(children);
            expect(parent.joined('partner')).to.equal(partner);
            done();

          });

        });

    });

    it('Should also lazy load from Child', (done) => {

      Child.query()
        .limit(1)
        .end((err, children) => {

          let child = children[0];

          expect(err).to.equal(null);
          expect(child.get('parent')).to.be.undefined;

          child.include((err, parent) => {

            expect(err).to.equal(null);
            expect(parent).to.exist;
            expect(child.joined('parent')).to.equal(parent);
            done();

          });

        });

    });

    it('Should orderBy properly (DESC)', function(done) {

      Child.query()
        .orderBy('id', 'DESC')
        .end((err, children) => {

          expect(err).to.equal(null);
          expect(children).to.be.an.instanceOf(Nodal.ModelArray);
          expect(children.length).to.equal(100);
          expect(children[0].get('id')).to.equal(100);
          done();

        });

    });

    it('Should limit properly (10)', function(done) {

      Child.query()
        .limit(5, 10)
        .end((err, children) => {

          expect(err).to.equal(null);
          expect(children).to.be.an.instanceOf(Nodal.ModelArray);
          expect(children.length).to.equal(10);
          expect(children._meta.total).to.equal(100);
          expect(children._meta.offset).to.equal(5);
          done();

        });

    });

    it('Should limit properly (query params, offset)', (done) => {

      Child.query()
        .where({__offset: 5})
        .end((err, children) => {

          expect(err).to.equal(null);
          expect(children).to.be.an.instanceOf(Nodal.ModelArray);
          expect(children.length).to.equal(95);
          expect(children._meta.total).to.equal(100);
          expect(children._meta.offset).to.equal(5);
          done();

        });

    });

    it('Should limit properly (query params, count)', (done) => {

      Child.query()
        .where({__count: 10})
        .end((err, children) => {

          expect(err).to.equal(null);
          expect(children).to.be.an.instanceOf(Nodal.ModelArray);
          expect(children.length).to.equal(10);
          expect(children._meta.total).to.equal(100);
          expect(children._meta.offset).to.equal(0);
          done();

        });

    });

    it('Should limit properly (query params, count + offset)', (done) => {

      Child.query()
        .where({__offset: 5, __count: 10})
        .end((err, children) => {

          expect(err).to.equal(null);
          expect(children).to.be.an.instanceOf(Nodal.ModelArray);
          expect(children.length).to.equal(10);
          expect(children._meta.total).to.equal(100);
          expect(children._meta.offset).to.equal(5);
          done();

        });

    });

    it('Should limit and orderBy properly (ASC)', function(done) {

      Child.query()
        .limit(10, 10)
        .orderBy('id', 'ASC')
        .end((err, children) => {

          expect(err).to.equal(null);
          expect(children).to.be.an.instanceOf(Nodal.ModelArray);
          expect(children.length).to.equal(10);
          expect(children[0].get('id')).to.equal(11);
          done();

        });

    });

    it('Should first properly', function(done) {

      Parent.query()
        .orderBy('id', 'ASC')
        .first((err, parent) => {

          expect(err).to.equal(null);
          expect(parent).to.exist;
          expect(parent.get('id')).to.equal(1);
          done();

        });

    });

    it('Should give error on first if nothing found', function(done) {

      Parent.query()
        .where({name: 'Spongebob'})
        .first((err, parent) => {

          expect(err).to.exist;
          expect(parent).to.not.exist;
          done();

        });

    });

    it('Should do an "is" where query properly', (done) => {

      Parent.query()
        .where({name: 'Zoolander'})
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(1);
          expect(parents[0].get('name')).to.equal('Zoolander');
          done();

        });

    });

    it('Should do an "not" where query properly', (done) => {

      Parent.query()
        .where({name__not: 'Zoolander'})
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(9);
          done();

        });

    });

    it('Should do a "lt" where query properly', (done) => {

      Parent.query()
        .where({name__lt: 'Zoolander'})
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(9);
          done();

        });

    });

    it('Should do a "lte" where query properly', (done) => {

      Parent.query()
        .where({name__lte: 'Zoolander'})
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(10);
          done();

        });

    });

    it('Should do a "gt" where query properly', (done) => {

      Parent.query()
        .where({name__gt: 'Albert'})
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(9);
          done();

        });

    });

    it('Should do a "gte" where query properly', (done) => {

      Parent.query()
        .where({name__gte: 'Albert'})
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(10);
          done();

        });

    });

    it('Should do a "contains" where query properly', (done) => {

      Parent.query()
        .where({name__contains: 'am'}) // James, Samantha, Samuel
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(3);
          done();

        });

    });

    it('Should do an "icontains" where query properly', (done) => {

      Parent.query()
        .where({name__icontains: 'z'}) // Suzy, Zoolander
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(2);
          done();

        });

    });

    it('Should do an "startswith" where query properly', (done) => {

      Parent.query()
        .where({name__startswith: 'Sam'}) // Samantha, Samuel
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(2);
          done();

        });

    });

    it('Should do an "endswith" where query properly', (done) => {

      Parent.query()
        .where({name__endswith: 'y'}) // Dingleberry, Sally, Suzy
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(3);
          done();

        });

    });

    it('Should do an "iendswith" where query properly', (done) => {

      Parent.query()
        .where({name__iendswith: 'Y'}) // Dingleberry, Sally, Suzy
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(3);
          done();

        });

    });

    it('Should allow for OR queries', (done) => {

      Parent.query()
        .where({name: 'Zoolander'}, {name: 'Albert'})
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(2);
          done();

        });

    });

    it('Should where by "hidden" field', (done) => {

      Parent.query()
        .where({hidden: 'a'})
        .end((err, parents) => {

          expect(parents.length).to.be.lessThan(10);
          done();

        });

    });

    it('Should safeWhere and ignore "hidden" field', (done) => {

      Parent.query()
        .safeWhere({hidden: 'a'})
        .end((err, parents) => {

          expect(parents.length).to.equal(10);
          done();

        });

    });

    it('Should safeWhere and ignore "hidden" field with modifier', (done) => {

      Parent.query()
        .safeWhere({hidden__not: 'a'})
        .end((err, parents) => {

          expect(parents.length).to.equal(10);
          done();

        });

    });

    it('Should find all children with parent id = "1", by id', (done) => {

      Child.query()
        .where({parent_id: 1})
        .end((err, children) => {

          expect(err).to.equal(null);
          expect(children.length).to.equal(10);
          done();

        });

    });

    it('Should find all children with parent id = "1", by joining', (done) => {

      Child.query()
        .join('parent')
        .where({parent__id: 1})
        .end((err, children) => {

          expect(err).to.equal(null);
          expect(children.length).to.equal(10);
          done();

        });

    });

    it('Should find all children with parent name = "Zoolander", by joining', (done) => {

      Child.query()
        .join('parent')
        .where({parent__name: 'Zoolander'})
        .end((err, children) => {

          expect(err).to.equal(null);
          expect(children.length).to.equal(10);
          done();

        });

    });

    it('Should find all parents with children id <= 15, by joining', (done) => {

      Parent.query()
        .join('children')
        .where({children__id__lte: 15})
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(2);
          expect(parents[0].joined('children').length).to.equal(10);
          expect(parents[1].joined('children').length).to.equal(10);
          done();

        });

    });

    it('Should find all parents with children id <= 15, by joining with restrictions', (done) => {

      Parent.query()
        .join('children', {id__lte: 15})
        .where({children__id__lte: 15})
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(2);
          expect(parents[0].joined('children').length).to.equal(10);
          expect(parents[1].joined('children').length).to.equal(5);
          done();

        });

    });

    it('Should find all parents with children id <= 15, by joining with more restrictions', (done) => {

      Parent.query()
        .join('children', {id__lte: 15, id__gte: 11})
        .where({children__id__lte: 15})
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(2);
          expect(parents[0].joined('children').length).to.equal(0);
          expect(parents[1].joined('children').length).to.equal(5);
          done();

        });

    });

    it('Should find all parents with children id <= 15, by joining with parent restrictions', (done) => {

      Parent.query()
        .join('children', {parent__id: 1})
        .where({children__id__lte: 15})
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(2);
          expect(parents[0].joined('children').length).to.equal(10);
          expect(parents[1].joined('children').length).to.equal(0);
          done();

        });

    });

    it('Should join children and partners both to parents', (done) => {

      Parent.query()
        .join('children')
        .join('partner')
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(10);
          done();

        });

    });

    it('Should join children and partners both to parents, and where each', (done) => {

      Parent.query()
        .join('children')
        .where({children__id__lte: 25})
        .join('partner')
        .where({partner__name: 'Partner0'}, {partner__name: 'Partner1'})
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(2);
          done();

        });

    });

    it('Should where from both relationships, but keep 10 children per parent', (done) => {

      Parent.query()
        .join('children')
        .where({children__id__lte: 25})
        .join('partner')
        .where({partner__name: 'Partner0'}, {partner__name: 'Partner1'})
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(2);
          expect(parents[0].joined('children').length).to.equal(10);
          expect(parents[1].joined('children').length).to.equal(10);
          done();

        });

    });

    it('Should join children and partners both to parents, and where each, with an additional where of the first join', (done) => {

      Parent.query()
        .join('children')
        .where({children__id__lte: 25})
        .join('partner')
        .where({partner__name: 'Partner0'}, {partner__name: 'Partner1'})
        .where({children__id__gte: 15})
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(1);
          done();

        });

    });

    it('Should limit based on the Parent, not joined fields', (done) => {

      Parent.query()
        .join('children')
        .where({children__id__lte: 70})
        .limit(5)
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(5);
          done();

        });

    });

    it('Should where without joining', (done) => {

      Parent.query()
        .where({children__id__lte: 70})
        .limit(5)
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(5);
          done();

        });

    });

    it('Should have Parent join many mutiple fields (Children, Pets) and parse properly', (done) => {

      Parent.query()
        .join('children')
        .join('pets')
        .limit(3)
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(3);

          parents.forEach(parent => {
            expect(parent.joined('children').length).to.equal(10);
            expect(parent.joined('pets').length).to.equal(3);
          });

          done();

        });

    });

    it('Should have Parent join Incoming + Outgoing Friendships', (done) => {

      Parent.query()
        .join('incomingFriendships')
        .join('outgoingFriendships')
        .orderBy('id', 'ASC')
        .end((err, parents) => {

          expect(err).to.equal(null);

          parents.forEach((parent, i) => {
            expect(parent.joined('incomingFriendships').length).to.equal(9 - i);
            expect(parent.joined('outgoingFriendships').length).to.equal(i);
          });

          done();

        });

    });

    it('Should get all Friendships and their Parents', (done) => {

      Friendship.query()
        .join('fromParent')
        .join('toParent')
        .end((err, friendships) => {

          expect(err).to.equal(null);
          expect(friendships.length).to.equal(45);

          friendships.forEach((friendship, i) => {
            expect(friendship.joined('fromParent')).to.not.be.undefined;
            expect(friendship.joined('toParent')).to.not.be.undefined;
          });

          done();

        });

    });

    it('Should get all Friendships belonging to a parent', (done) => {

      Friendship.query()
        .join('fromParent')
        .join('toParent')
        .where({fromParent__id: 5}, {toParent__id: 5})
        .end((err, friendships) => {

          expect(friendships.length).to.equal(9);

          friendships.forEach(friendship => {
            expect(
              friendship.joined('fromParent').get('id') === 5 ||
              friendship.joined('toParent').get('id') === 5
            ).to.equal(true);
          });

          done();

        });

    });

    it('Should update all parents names', (done) => {

      Parent.query()
        .update({name: 'Dave'}, (err, parents) => {

          expect(parents.length).to.equal(10);

          parents.forEach(parent => {
            expect(parent.get('name')).to.equal('Dave');
          });

          done();

        });

    });

    it('Should update all childrens ages', (done) => {

      Child.query().orderBy('id').end((err, children) => {

        let ages = children.map(c => c.get('age'));

        Child.query()
          .orderBy('id')
          .update({age: age => `${age} + 10`}, (err, children) => {

            children.forEach((child, i) => {
              expect(child.get('age')).to.equal(ages[i] + 10);
            });

            done();

          });

      });

    });

    it('Should update all parents names and join children', (done) => {

      Parent.query()
        .join('children')
        .update({name: 'Bertrand'}, (err, parents) => {

          expect(parents.length).to.equal(10);

          parents.forEach(parent => {
            expect(parent.joined('children').length).to.equal(10);
            expect(parent.get('name')).to.equal('Bertrand');
          });

          done();

        });

    });

    it('Should update all parents names and join children, and order by id DESC', (done) => {

      Parent.query()
        .join('children')
        .orderBy('id', 'DESC')
        .update({name: 'Bertrand'}, (err, parents) => {

          expect(parents.length).to.equal(10);

          parents.forEach((parent, i) => {
            expect(parent.joined('children').length).to.equal(10);
            expect(parent.get('name')).to.equal('Bertrand');
            expect(parent.get('id')).to.equal(10 - i);
          });

          done();

        });

    });

    it('Should join children to pets', done => {

      Pet.query()
        .join('parent__children')
        .first((err, pet) => {

          expect(err).to.not.exist;
          expect(pet).to.exist;
          expect(pet.joined('parent').joined('children')).to.exist;
          expect(pet.joined('parent').joined('children').length).to.equal(10);
          done();

        });

    });

    it('Should join pets to children', done => {

      Child.query()
        .join('parent__pets')
        .first((err, child) => {

          expect(err).to.not.exist;
          expect(child).to.exist;
          expect(child.joined('parent').joined('pets')).to.exist;
          expect(child.joined('parent').joined('pets').length).to.equal(3);
          done();

        });

    });

    it('Should join parent and children to pets', done => {

      Pet.query()
        .join('parent')
        .join('parent__children')
        .first((err, pet) => {

          expect(err).to.not.exist;
          expect(pet).to.exist;
          expect(pet.joined('parent').joined('children')).to.exist;
          expect(pet.joined('parent').joined('children').length).to.equal(10);
          expect(pet.joined('parent')).to.exist;
          done();

        });

    });

    it('Should join parent and children to pets with only lowest join', done => {

      Pet.query()
        .join('parent__children')
        .first((err, pet) => {

          expect(err).to.not.exist;
          expect(pet).to.exist;
          expect(pet.joined('parent').joined('children')).to.exist;
          expect(pet.joined('parent').joined('children').length).to.equal(10);
          expect(pet.joined('parent')).to.exist;
          done();

        });

    });

    it('Should query pet by children', done => {

      Pet.query()
        .where({parent__children__id__lte: 50})
        .end((err, pets) => {

          expect(err).to.not.exist;
          expect(pets).to.exist;
          expect(pets.length).to.equal(15);
          done();

        });

    });

    it('Should query pet by parent and by pet value', done => {

      Pet.query()
        .where({parent__id__gt: 1, created_at__lte: new Date()})
        .end((err, pets) => {

          expect(err).to.not.exist;
          expect(pets).to.exist;
          expect(pets.length).to.equal(27);
          done();

        });

    });

    it('Should query a pet based on json key existance', (done) => {
      Pet.query()
        .where({details__jsoncontains: 'language'})
        .end((err, pets) => {

            expect(err).to.not.exist;
            expect(pets.length).to.equal(30);
            done();

          });

    });

    it('Should query a pet based on json key value', (done) => {
      Pet.query()
        .where({details__json: { language: true }})
        .end((err, pets) => {

            expect(err).to.not.exist;
            expect(pets.length).to.equal(10);
            done();

          });

    });

    it('Should group by shirt', done => {

      Parent.query()
        .groupBy('shirt')
        .end((err, groups) => {

          expect(err).to.not.exist;
          expect(groups.length).to.equal(3);
          done();

        });

    });

    it('Should group and order by shirt', done => {

      Parent.query()
        .groupBy('shirt')
        .orderBy('shirt', 'ASC')
        .end((err, groups) => {

          expect(err).to.not.exist;
          expect(groups.length).to.equal(3);
          expect(groups[0].shirt).to.equal('blue');
          done();

        });

    });

    it('Should group by shirt, and get a count alias and another mapping', done => {

      Parent.query()
        .groupBy('shirt')
        .aggregate('count', id => `COUNT(${id})`)
        .aggregate('red_or_blue', shirt => `CASE WHEN ${shirt} IN ('red', 'blue') THEN TRUE ELSE FALSE END`)
        .orderBy('shirt', 'ASC')
        .end((err, groups) => {

          expect(err).to.not.exist;
          expect(groups.length).to.equal(3);
          expect(groups[0].shirt).to.equal('blue');
          expect(groups[0].count).to.equal(3);
          expect(groups[0].red_or_blue).to.equal(true);
          done();

        });

    });

    it('Should group by shirt, and get a count alias, order by transformation', done => {

      Parent.query()
        .groupBy('shirt')
        .aggregate('count', id => `COUNT(${id})`)
        .orderBy(id => `COUNT(${id})`, 'DESC')
        .end((err, groups) => {

          expect(err).to.not.exist;
          expect(groups.length).to.equal(3);
          expect(groups[0].count).to.equal(4);
          done();

        });

    });

    it('Should apply filter, group by shirt, and get a count alias, order by transformation', done => {

      Parent.query()
        .where({id__gt: 2})
        .groupBy('shirt')
        .aggregate('count', id => `COUNT(${id})`)
        .orderBy(id => `COUNT(${id})`, 'DESC')
        .end((err, groups) => {

          expect(err).to.not.exist;
          expect(groups.length).to.equal(3);
          expect(groups[0].count).to.equal(3);
          done();

        });

    });

    it('Should apply filter, group by shirt and pantaloons', done => {

      Parent.query()
        .groupBy('shirt')
        .groupBy('pantaloons')
        .aggregate('count', id => `COUNT(${id})`)
        .orderBy(id => `COUNT(${id})`, 'DESC')
        .end((err, groups) => {

          expect(err).to.not.exist;
          expect(groups.length).to.equal(6);
          expect(groups[0]).to.haveOwnProperty('shirt');
          expect(groups[0]).to.haveOwnProperty('pantaloons');
          expect(groups[0]).to.haveOwnProperty('count');
          done();

        });

    });

    it('Should not fetch parents if they don\'t exist', done => {

      Child.create({name: 'Ada'}, (err, child) => {

        Child.query()
          .join('parent')
          .where({name: 'Ada'})
          .first((err, child) => {

            expect(err).to.not.exist;
            expect(child).to.exist;
            expect(child.joined('parent')).to.not.exist;
            done();

          });

      });

    });

    // IMPORTANT: Do npt place any tests after the `Should do a destroy cascade`
    // test since all models will be gone

    it('Should do a destroy cascade', (done) => {

      Parent.query()
        .end((err, parents) => {

          parents.destroyCascade(err => {

            expect(err).to.not.exist;
            done();

          });

        })

    });


  });

};
