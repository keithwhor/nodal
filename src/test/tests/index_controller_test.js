module.exports = (() => {

  'use strict';

  const Nodal = require('nodal');

  class IndexControllerTest extends Nodal.Test {

    test(expect) {

      it('Should return an HTTP 200 OK', done => {

        this.app.mockRequest('/').get((status, headers, body) => {

          expect(status).to.equal(200);
          done();

        });

      });

    }

  }

  return IndexControllerTest;

})();
