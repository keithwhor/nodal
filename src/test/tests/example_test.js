module.exports = (() => {

  'use strict';

  const Nodal = require('nodal');

  class ExampleTest extends Nodal.mocha.Test {

    test(expect) {

      it('Should compare 1 and 1', () => {

        expect(1).to.equal(1);

      });

      it('Should add 1 and 1, asynchronously', done => {

        setTimeout(() => {

          expect(1 + 1).to.equal(2);
          done();

        }, 10);

      });

    }

  }

  return ExampleTest;

})();
