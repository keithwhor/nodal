'use strict';

process.env.NODE_ENV = 'test';

const Nodal = require('nodal');
const TestRunner = Nodal.mocha.TestRunner;

const router = Nodal.require('app/router.js');

const tests = new TestRunner('./test/tests', router);

return describe('My Application', () => {

  /* Uncomment for database support */
  // before((done) => {
  //
  //   Nodal.my.bootstrapper.compose((err) => {
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
