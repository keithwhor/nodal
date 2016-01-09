module.exports = (function(Nodal) {

  'use strict';

  const async = require('async');

  let expect = require('chai').expect;

  describe('Nodal.Composer', function() {

    let db = new Nodal.Database();

    let schemaParent = {
      table: 'parents',
      columns: [
        {name: 'id', type: 'serial'},
        {name: 'name', type: 'string'},
        {name: 'created_at', type: 'datetime'}
      ]
    };

    let schemaFriendship = {
      table: 'friendships',
      columns: [
        {name: 'id', type: 'serial'},
        {name: 'from_parent_id', type: 'int'},
        {name: 'to_parent_id', type: 'int'},
        {name: 'created_at', type: 'datetime'}
      ]
    };

    let schemaChild = {
      table: 'children',
      columns: [
        {name: 'id', type: 'serial'},
        {name: 'parent_id', type: 'int'},
        {name: 'name', type: 'string'},
        {name: 'age', type: 'int'},
        {name: 'created_at', type: 'datetime'}
      ]
    };

    let schemaPartner = {
      table: 'partners',
      columns: [
        {name: 'id', type: 'serial'},
        {name: 'parent_id', type: 'int'},
        {name: 'name', type: 'string'},
        {name: 'job', type: 'string'},
        {name: 'created_at', type: 'datetime'}
      ]
    };

    let schemaPet = {
      table: 'pets',
      columns: [
        {name: 'id', type: 'serial'},
        {name: 'parent_id', type: 'int'},
        {name: 'name', type: 'string'},
        {name: 'animal', type: 'string'},
        {name: 'created_at', type: 'datetime'}
      ]
    };

    class Parent extends Nodal.Model {}

    Parent.setDatabase(db);
    Parent.setSchema(schemaParent);

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
          ].map(name => new Parent({name: name}));

          parents = Nodal.ModelArray.from(parents);

          parents.forEach((p, i) => {

            let children = 'ABCDEFGHIJ'.split('').map(name => {
              return new Child({name: `Child${name}`, age: (Math.random() * 30) | 0});
            });

            p.set('children', Nodal.ModelArray.from(children));

            let pets = ['Oliver', 'Ruby', 'Pascal'].map((name, i) => {
              return new Pet({name: name, animal: ['Cat', 'Dog', 'Cat'][i]});
            });

            p.set('pets', Nodal.ModelArray.from(pets));

            let partner = new Partner({name: `Partner${i}`, job: ['Plumber', 'Engineer', 'Nurse'][(Math.random() * 3) | 0]});
            p.set('partner', partner);

            let friendships = new Nodal.ModelArray(Friendship);
            while (i--) {
              let friendship = new Friendship({to_parent_id: i + 1});
              friendships.push(friendship);
            }

            p.set('outgoingFriendships', friendships);

          });

          parents.saveAll(err => {

            expect(err).to.equal(null);

            async.series(
              [].concat(
                parents.map(p => p.get('children').saveAll.bind(p.get('children'))),
                parents.map(p => p.get('pets').saveAll.bind(p.get('pets'))),
                parents.map(p => p.get('partner').save.bind(p.get('partner'))),
                parents.map(p => p.get('outgoingFriendships').saveAll.bind(p.get('outgoingFriendships'))).filter(p => p)
              ), (err) => {

                expect(err).to.be.undefined;
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
          expect(parent.get('children')).to.be.undefined;
          expect(parent.get('partner')).to.be.undefined;

          parent.include((err, children, partner) => {

            expect(err).to.equal(null);
            expect(children.length).to.equal(10);
            expect(partner).to.exist;
            expect(parent.get('children')).to.equal(children);
            expect(parent.get('partner')).to.equal(partner);
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
            expect(child.get('parent')).to.equal(parent);
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
        .limit(10)
        .end((err, children) => {

          expect(err).to.equal(null);
          expect(children).to.be.an.instanceOf(Nodal.ModelArray);
          expect(children.length).to.equal(10);
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

    it('Should do a "like" where query properly', (done) => {

      Parent.query()
        .where({name__like: 'am'}) // James, Samantha, Samuel
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(3);
          done();

        });

    });

    it('Should do an "ilike" where query properly', (done) => {

      Parent.query()
        .where({name__ilike: 'z'}) // Suzy, Zoolander
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
          expect(parents[0].get('children').length).to.equal(10);
          expect(parents[1].get('children').length).to.equal(10);
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
            expect(parent.get('children').length).to.equal(10);
            expect(parent.get('pets').length).to.equal(3);
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
            expect(parent.get('incomingFriendships').length).to.equal(9 - i);
            expect(parent.get('outgoingFriendships').length).to.equal(i);
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
            expect(friendship.get('fromParent')).to.not.be.undefined;
            expect(friendship.get('toParent')).to.not.be.undefined;
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
              friendship.get('fromParent').get('id') === 5 ||
              friendship.get('toParent').get('id') === 5
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

    it('Should update all parents names and join children', (done) => {

      Parent.query()
        .join('children')
        .update({name: 'Bertrand'}, (err, parents) => {

          expect(parents.length).to.equal(10);

          parents.forEach(parent => {
            expect(parent.get('children').length).to.equal(10);
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
            expect(parent.get('children').length).to.equal(10);
            expect(parent.get('name')).to.equal('Bertrand');
            expect(parent.get('id')).to.equal(10 - i);
          });

          done();

        });

    });

  });

});
