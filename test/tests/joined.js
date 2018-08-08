'use strict';

module.exports = Nodal => {

  const async = require('async');

  let expect = require('chai').expect;

  describe('Nodal.Composer', function() {

    let db = new Nodal.Database();

    let schemaUser = {
      table: 'users',
      columns: [
        {name: 'id', type: 'serial'},
        {name: 'username', type: 'string'},
        {name: 'created_at', type: 'datetime'},
        {name: 'updated_at', type: 'datetime'}
      ]
    };

    let schemaMembership = {
      table: 'memberships',
      columns: [
        {name: 'id', type: 'serial'},
        {name: 'user_id', type: 'int'},
        {name: 'organization_id', type: 'int'},
        {name: 'created_at', type: 'datetime'},
        {name: 'updated_at', type: 'datetime'}
      ]
    };

    class User extends Nodal.Model {}

    User.setDatabase(db);
    User.setSchema(schemaUser);

    class Membership extends Nodal.Model {}

    Membership.setDatabase(db);
    Membership.setSchema(schemaMembership);
    Membership.joinsTo(User, {multiple: true, as: 'memberships'});
    Membership.joinsTo(User, {multiple: true, via: 'organization_id', name: 'organization', as: 'members'});

    before(function(done) {

      db.connect(Nodal.my.Config.db.main);

      db.transaction(
        [schemaUser, schemaMembership].map(schema => {
          return [
            db.adapter.generateDropTableQuery(schema.table, true),
            db.adapter.generateCreateTableQuery(schema.table, schema.columns)
          ].join(';');
        }).join(';'),
        function(err, result) {

          expect(err).to.equal(null);

          let users = Nodal.ModelArray.from([
            new User({username: 'francis'}),
            new User({username: 'felicia'}),
            new User({username: 'gregory'}),
            new User({username: 'georgia'}),
            new User({username: 'facebook'}),
            new User({username: 'google'})
          ]);

          let memberships = Nodal.ModelArray.from([
            new Membership({user_id: 1, organization_id: 5}),
            new Membership({user_id: 2, organization_id: 5}),
            new Membership({user_id: 3, organization_id: 6}),
            new Membership({user_id: 4, organization_id: 6})
          ]);

          async.series([
            users.saveAll.bind(users),
            memberships.saveAll.bind(memberships)
          ], (err) => {
            expect(err).to.not.exist;
            done();
          });
        }
      );

    });

    after(function(done) {

      db.close(function() {
        done();
      });

    });

    it('Should query all users (6)', function(done) {

      User.query()
        .end((err, users) => {

          expect(err).to.equal(null);
          expect(users).to.be.an.instanceOf(Nodal.ModelArray);
          expect(users.length).to.equal(6);
          done();

        });

    });

    it('Should find Georgia as a member of Google', (done) => {

      Membership.query()
        .join('user')
        .join('organization')
        .where({
          user__username: 'georgia',
          organization__username: 'google'
        })
        .end((err, memberships) => {

          expect(err).to.equal(null);
          expect(memberships).to.be.an.instanceOf(Nodal.ModelArray);
          expect(memberships.length).to.equal(1);
          expect(memberships[0].joined('user').get('username')).to.equal('georgia');
          expect(memberships[0].joined('organization').get('username')).to.equal('google');
          done();

        });

    });

  });

};
