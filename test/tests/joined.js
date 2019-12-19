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
        {name: 'organization_location_id', type: 'int'},
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

    let schemaOrganizationLocations = {
      table: 'organization_locations',
      columns: [
        {name: 'id', type: 'serial'},
        {name: 'organization_id', type: 'int'},
        {name: 'organization_authorization_access_code', type: 'string'},
        {name: 'location', type: 'string'},
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

    class OrganizationLocations extends Nodal.Model {}

    OrganizationLocations.setDatabase(db);
    OrganizationLocations.setSchema(schemaOrganizationLocations);
    OrganizationLocations.joinsTo(User, {multiple: true, via: 'organization_id', name: 'organization', as: 'organizationLocations'});

    User.joinsTo(OrganizationLocations, {multiple: true, via: 'organization_location_id', name: 'organizationLocation', as: 'engineeringStaffMembers'});

    before(function(done) {

      db.connect(Nodal.my.Config.db.main);

      db.transaction(
        [schemaUser, schemaMembership, schemaOrganizationLocations].map(schema => {
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
            new User({username: 'gilliam'}),
            new User({username: 'facebook'}),
            new User({username: 'google'}),
            new User({username: 'sergey', organization_location_id: 1}),
          ]);

          let memberships = Nodal.ModelArray.from([
            new Membership({user_id: 1, organization_id: 6}),
            new Membership({user_id: 2, organization_id: 6}),
            new Membership({user_id: 3, organization_id: 7}),
            new Membership({user_id: 4, organization_id: 7}),
            new Membership({user_id: 5, organization_id: 7})
          ]);

          let organizationLocations = Nodal.ModelArray.from([
            new OrganizationLocations({organization_id: 7, organization_authorization_access_code: 'secret_password', location: 'Mountain View'})
          ]);

          async.series([
            users.saveAll.bind(users),
            memberships.saveAll.bind(memberships),
            organizationLocations.saveAll.bind(organizationLocations)
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

    it('Should query all users (8)', function(done) {

      User.query()
        .end((err, users) => {

          expect(err).to.equal(null);
          expect(users).to.be.an.instanceOf(Nodal.ModelArray);
          expect(users.length).to.equal(8);
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

    it('Should truncate joined model names when querying', (done) => {

      User.query()
        .join('memberships')
        .join('memberships__organization')
        .join('memberships__organization__organizationLocations')
        .join('memberships__organization__organizationLocations__engineeringStaffMembers')
        .where({
          username: 'georgia',
          memberships__organization__username: 'google'
        })
        .end((err, users) => {

          expect(err).to.equal(null);
          expect(users).to.be.an.instanceOf(Nodal.ModelArray);
          expect(users.length).to.equal(1);
          expect(users[0].joined('memberships').length).to.equal(1);
          expect(users[0].joined('memberships')[0].joined('organization').get('username')).to.equal('google');
          let hq = users[0].joined('memberships')[0].joined('organization').joined('organizationLocations')[0];
          expect(hq).to.exist;
          expect(hq.get('location')).to.equal('Mountain View');
          expect(hq.get('organization_authorization_access_code')).to.equal('secret_password');
          expect(hq.joined('engineeringStaffMembers').length).to.equal(1);
          expect(hq.joined('engineeringStaffMembers')[0].get('username')).to.equal('sergey');
          done();

        });

    });

    it('Should filter comparisons in nested join statements properly', (done) => {

      User.query()
        .join('members')
        .join('members__user', {username: 'georgia'}, {username: 'gregory'})
        .where({username: 'google'})
        .end((err, organizations) => {

          expect(err).to.equal(null);
          expect(organizations).to.be.an.instanceOf(Nodal.ModelArray);
          expect(organizations.length).to.equal(1);
          expect(organizations[0].joined('members').length).to.equal(3);
          expect(organizations[0].joined('members').find((member) => {
            return member.joined('user') && member.joined('user').get('username') === 'georgia';
          })).to.exist;
          expect(organizations[0].joined('members').find((member) => {
            return member.joined('user') && member.joined('user').get('username') === 'gregory';
          })).to.exist;
          expect(organizations[0].joined('members').find((member) => {
            return member.joined('user') && member.joined('user').get('username') === 'gilliam';
          })).to.not.exist;
          done();

        });

    });

    it('Should filter on comparisons containing joined fields within join statements properly', (done) => {

      User.query()
        .join('members', {user__username: 'georgia'}, {user__username: 'gilliam'})
        .join('members__user')
        .where({username: 'google'})
        .end((err, organizations) => {

          expect(err).to.equal(null);
          expect(organizations).to.be.an.instanceOf(Nodal.ModelArray);
          expect(organizations.length).to.equal(1);
          expect(organizations[0].joined('members').length).to.equal(2);
          expect(organizations[0].joined('members').find((member) => {
            return member.joined('user') && member.joined('user').get('username') === 'georgia';
          })).to.exist;
          expect(organizations[0].joined('members').find((member) => {
            return member.joined('user') && member.joined('user').get('username') === 'gilliam';
          })).to.exist;
          done();

        });

    });

  });

};
