module.exports = (() => {

  'use strict';

  const Nodal = require('nodal');
  Nodal.env.name = 'test';

  const daemon = new Nodal.Daemon('./app/app.js');
  const TestRunner = new Nodal.mocha.TestRunner('./test/tests');

  describe('My Application', () => {

    before((done) => {

      Nodal.my.bootstrapper.bootstrap(() => {

        daemon.start(app => {

          TestRunner.ready(app);
          done();

        });

      })

    });

    TestRunner.start(require('chai').expect);

  });

})();
