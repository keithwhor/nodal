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

    it('should filter query keys with except()', () => {

      let param = new Nodal.StrongParam({
        title: 'Some Title',
        name: 'Some Name',
        query: new Nodal.StrongParam({
          name: 'Tom Saywer',
          task: 'Paint Fence'
        })
      }).except('task')

      expect(param.query).to.have.ownProperty('name');
      expect(param.query).to.not.have.ownProperty('task');

    });

    it('should filter body keys with except()', () => {

      let param = new Nodal.StrongParam({
        title: 'Some Title',
        name: 'Some Name',
        task: 'Some Task',
        body: new Nodal.StrongParam({
          name: 'Tom Saywer',
          task: 'Paint Fence'
        })
      }).except('task')

      expect(param).to.not.have.ownProperty('task');
      expect(param.body).to.have.ownProperty('name');
      expect(param.body).to.not.have.ownProperty('task');

    });

    it('should allow body keys with permit()', () => {

      let param = new Nodal.StrongParam({
        title: 'Some Title',
        name: 'Some Name',
        task: 'Some Task',
        body: new Nodal.StrongParam({
          name: 'Tom Saywer',
          task: 'Paint Fence'
        })
      }).permit('name')

      console.log(param)

      expect(param).to.have.ownProperty('name');

    });

    it('should filter body data multiple keys with permit()', () => {

      let param = new Nodal.StrongParam({
        title: 'Some Title',
        name: 'Some Name',
        task: 'Some Task',
        body: new Nodal.StrongParam({
          name: 'Tom Saywer',
          task: 'Paint Fence'
        })
      }).except('name', 'task')


      expect(param).to.not.have.ownProperty('task');
      expect(param.body).to.not.have.ownProperty('name');
      expect(param.body).to.not.have.ownProperty('task');

    });



  });

});
