module.exports = (() => {

  'use strict';

  const Nodal = require('nodal');
  const TestRunner = Nodal.mocha.TestRunner;
  
  const router = Nodal.require('app/router.js');

  const tests = new TestRunner('./test/tests', router);

  return describe('My Application', () => {

    /* Uncomment for database support */
    // before((done) => {
    //
    //   Nodal.my.bootstrapper.bootstrap((err) => {
    //
    //     if (err) {
    //       console.error(err);
    //       throw err;
    //     }
    //
    //     done();
    //
    //   })
    //
    // });

    tests.start(require('chai').expect);

  });

})();
