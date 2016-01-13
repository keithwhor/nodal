module.exports = (() => {

  'use strict';

  const Nodal = require('nodal');
  Nodal.env = 'test';

  const daemon = new Nodal.Daemon('./app/app.js');
  const TestRunner = new Nodal.TestRunner('./test/tests');

  describe('My Application', () => {

    before((done) => {

      daemon.start(app => {

        TestRunner.ready(app);
        done();

      });

    });

    TestRunner.start(require('chai').expect);

  });

})();
