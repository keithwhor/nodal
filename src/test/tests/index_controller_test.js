module.exports = (() => {

  'use strict';

  const Nodal = require('nodal');

  class IndexControllerTest extends Nodal.mocha.Test {

    test(expect) {

      it('Should return an HTTP 200', done => {

        this.app.endpoint('/').get((status, headers, body) => {

          expect(status).to.equal(200);
          done();

        });

      });

    }

  }

  return IndexControllerTest;

})();
