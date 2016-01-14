module.exports = (() => {

  'use strict';

  const Nodal = require('nodal');

  const daemon = new Nodal.Daemon('./app/app.js');
  const TestRunner = new Nodal.mocha.TestRunner('./test/tests');

  describe('My Application', () => {

    before((done) => {

      Nodal.my.bootstrapper.bootstrap((err) => {

        if (err) {
          console.error(err);
          throw err;
        }

        daemon.start(app => {

          TestRunner.ready(app);
          done();

        });

      })

    });

    TestRunner.start(require('chai').expect);

  });

})();
