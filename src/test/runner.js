module.exports = (() => {

  'use strict';

  const Nodal = require('nodal');

  const daemon = new Nodal.Daemon('./app/app.js');
  const testRunner = new Nodal.mocha.TestRunner('./test/tests');

  function startDaemon(done) {

    daemon.start(app => {

      testRunner.ready(app);
      done();

    });

  }

  function bootstrap(done) {

    Nodal.my.bootstrapper.bootstrap((err) => {

      if (err) {
        console.error(err);
        throw err;
      }

      startDaemon(done);

    })

  }

  return describe('My Application', () => {

    // before(bootstrap); // Use if you need database support
    before(startDaemon);

    testRunner.start(require('chai').expect);

  });

})();
