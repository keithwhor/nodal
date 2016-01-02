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

    class Parent extends Nodal.Model {}

    Parent.setDatabase(db);
    Parent.setSchema(schemaParent);

    class Child extends Nodal.Model {}

    Child.setDatabase(db);
    Child.setSchema(schemaChild);
    Child.joinsTo(Parent, {multiple: true});

    class Partner extends Nodal.Model {}

    Partner.setDatabase(db);
    Partner.setSchema(schemaPartner);
    Partner.joinsTo(Parent);

    before(function(done) {

      db.connect(Nodal.my.Config.db.main);

      db.transaction(
        [schemaParent, schemaChild, schemaPartner].map(schema => {
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

            let partner = new Partner({name: `Partner${i}`, job: ['Plumber', 'Engineer', 'Nurse'][(Math.random() * 3) | 0]});
            p.set('partner', partner);

          });

          parents.saveAll(err => {

            expect(err).to.equal(null);

            async.series(
              [].concat(
                parents.map(p => p.get('children').saveAll.bind(p.get('children'))),
                parents.map(p => p.get('partner').save.bind(p.get('partner')))
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

    it('Should do an "is" filter properly', (done) => {

      Parent.query()
        .filter({name: 'Zoolander'})
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(1);
          expect(parents[0].get('name')).to.equal('Zoolander');
          done();

        });

    });

    it('Should do an "not" filter properly', (done) => {

      Parent.query()
        .filter({name__not: 'Zoolander'})
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(9);
          done();

        });

    });

    it('Should do a "lt" filter properly', (done) => {

      Parent.query()
        .filter({name__lt: 'Zoolander'})
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(9);
          done();

        });

    });

    it('Should do a "lte" filter properly', (done) => {

      Parent.query()
        .filter({name__lte: 'Zoolander'})
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(10);
          done();

        });

    });

    it('Should do a "gt" filter properly', (done) => {

      Parent.query()
        .filter({name__gt: 'Albert'})
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(9);
          done();

        });

    });

    it('Should do a "gte" filter properly', (done) => {

      Parent.query()
        .filter({name__gte: 'Albert'})
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(10);
          done();

        });

    });

    it('Should do a "like" filter properly', (done) => {

      Parent.query()
        .filter({name__like: 'am'}) // James, Samantha, Samuel
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(3);
          done();

        });

    });

    it('Should do an "ilike" filter properly', (done) => {

      Parent.query()
        .filter({name__ilike: 'z'}) // Suzy, Zoolander
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(2);
          done();

        });

    });

    it('Should do an "startswith" filter properly', (done) => {

      Parent.query()
        .filter({name__startswith: 'Sam'}) // Samantha, Samuel
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(2);
          done();

        });

    });

    it('Should do an "endswith" filter properly', (done) => {

      Parent.query()
        .filter({name__endswith: 'y'}) // Dingleberry, Sally, Suzy
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(3);
          done();

        });

    });

    it('Should do an "iendswith" filter properly', (done) => {

      Parent.query()
        .filter({name__iendswith: 'Y'}) // Dingleberry, Sally, Suzy
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(3);
          done();

        });

    });

    it('Should allow for OR queries', (done) => {

      Parent.query()
        .filter({name: 'Zoolander'}, {name: 'Albert'})
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(2);
          done();

        });

    });

    it('Should find all children with parent id = "1", by id', (done) => {

      Child.query()
        .filter({parent_id: 1})
        .end((err, children) => {

          expect(err).to.equal(null);
          expect(children.length).to.equal(10);
          done();

        });

    });

    it('Should find all children with parent id = "1", by joining', (done) => {

      Child.query()
        .join('parent')
        .filter({parent__id: 1})
        .end((err, children) => {

          expect(err).to.equal(null);
          expect(children.length).to.equal(10);
          done();

        });

    });

    it('Should find all children with parent name = "Zoolander", by joining', (done) => {

      Child.query()
        .join('parent')
        .filter({parent__name: 'Zoolander'})
        .end((err, children) => {

          expect(err).to.equal(null);
          expect(children.length).to.equal(10);
          done();

        });

    });

    it('Should find all parents with children id <= 15, by joining', (done) => {

      Parent.query()
        .join('children')
        .filter({children__id__lte: 15})
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

    it('Should join children and partners both to parents, and filter each', (done) => {

      Parent.query()
        .join('children')
        .filter({children__id__lte: 25})
        .join('partner')
        .filter({partner__name: 'Partner0'}, {partner__name: 'Partner1'})
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(2);
          done();

        });

    });

    it('Should filter from both relationships, but keep 10 children per parent', (done) => {

      Parent.query()
        .join('children')
        .filter({children__id__lte: 25})
        .join('partner')
        .filter({partner__name: 'Partner0'}, {partner__name: 'Partner1'})
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(2);
          expect(parents[0].get('children').length).to.equal(10);
          expect(parents[1].get('children').length).to.equal(10);
          done();

        });

    });

    it('Should join children and partners both to parents, and filter each, with an additional filter of the first join', (done) => {

      Parent.query()
        .join('children')
        .filter({children__id__lte: 25})
        .join('partner')
        .filter({partner__name: 'Partner0'}, {partner__name: 'Partner1'})
        .filter({children__id__gte: 15})
        .end((err, parents) => {

          expect(err).to.equal(null);
          expect(parents.length).to.equal(1);
          done();

        });

    });

  });

});
