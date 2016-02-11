module.exports = (function(Nodal) {

  'use strict';

  const async = require('async');

  let expect = require('chai').expect;

  describe('Strong Parameters', function() {

    it('should act like plain object', () => {

      let param = new Nodal.StrongParam({
        title: 'Some Title',
        name: 'Some Name'
      });

      expect(param).to.have.ownProperty('title');
      expect(param).to.have.ownProperty('name');
      expect(param.name).to.equal('Some Name');
      expect(param.title).to.equal('Some Title');

    });

    it('should filter top level keys with except()', () => {

      let param = new Nodal.StrongParam({
        title: 'Some Title',
        name: 'Some Name',
        query: {
          name: 'Tom Saywer',
          task: 'Paint Fence'
        }
      }).except('name');

      expect(param).to.have.ownProperty('title');
      expect(param).to.not.have.ownProperty('name');
      expect(param).to.have.ownProperty('query');
      expect(param.query).to.have.ownProperty('name');
      expect(param.query).to.have.ownProperty('task');

    });

    it('should filter sub level keys with except()', () => {

      let param = new Nodal.StrongParam({
        title: 'Some Title',
        name: 'Some Name',
        query: {
          name: 'Tom Saywer',
          task: 'Paint Fence'
        }
      }).except({query: ['name']});

      expect(param).to.have.ownProperty('title');
      expect(param).to.have.ownProperty('name');
      expect(param).to.have.ownProperty('query');
      expect(param.query).to.not.have.ownProperty('name');
      expect(param.query).to.have.ownProperty('task');

    });

    it('should filter top level keys with permit()', () => {

      let param = new Nodal.StrongParam({
        title: 'Some Title',
        name: 'Some Name',
        query: {
          name: 'Tom Saywer',
          task: 'Paint Fence'
        }
      }).permit('name');

      expect(param).to.not.have.ownProperty('title');
      expect(param).to.have.ownProperty('name');
      expect(param).to.not.have.ownProperty('query');

    });

    it('should filter sub level keys with permit()', () => {

      let param = new Nodal.StrongParam({
        title: 'Some Title',
        name: 'Some Name',
        query: {
          name: 'Tom Saywer',
          task: 'Paint Fence'
        }
      }).permit({query: ['name']});

      expect(param).to.not.have.ownProperty('title');
      expect(param).to.not.have.ownProperty('name');
      expect(param).to.have.ownProperty('query');
      expect(param.query).to.have.ownProperty('name');
      expect(param.query).to.not.have.ownProperty('task');

    });

    it('should permit with regex *', () => {

      let param = new Nodal.StrongParam({
        name__gte: 7,
        name__in: [1, 2, 3],
        name__like: 'hello',
        age: 7,
        hello: 'world'
      });

      let pname = param.permit('name*');

      expect(pname).to.have.ownProperty('name__gte');
      expect(pname).to.have.ownProperty('name__in');
      expect(pname).to.have.ownProperty('name__like');
      expect(pname).to.not.have.ownProperty('age');
      expect(pname).to.not.have.ownProperty('hello');

    });

    it('should permit with regex (a,b,c)', () => {

      let param = new Nodal.StrongParam({
        name__gte: 7,
        name__in: [1, 2, 3],
        name__like: 'hello',
        age: 7,
        hello: 'world'
      });

      let pname = param.permit('name__(gte,in)', 'hello');

      expect(pname).to.have.ownProperty('name__gte');
      expect(pname).to.have.ownProperty('name__in');
      expect(pname).to.not.have.ownProperty('name__like');
      expect(pname).to.not.have.ownProperty('age');
      expect(pname).to.have.ownProperty('hello');

    });

  });

});
