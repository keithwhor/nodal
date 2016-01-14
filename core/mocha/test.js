module.exports = (() => {

  'use strict';

  const MockRequest = require('./mock_request.js');

  class Test {

    constructor(testRunner) {

      this.testRunner = testRunner;
      Object.defineProperty(this, 'app', {get: () => this.testRunner.app});

    }

    __test__(verb) {

      describe(this.constructor.name, () => {

        this.before && before(this.before.bind(this, verb));

        this.test(verb);

        this.after && after(this.after.bind(this, verb));

      });

    }

    /**
    * Creates a new MockRequest object (emulates an HTTP request)
    * @param {string} path The path you wish to hit
    * @param {Object} query The query parameters you wish to pass
    * @return {Nodal.MockRequest}
    */
    endpoint(path, query) {

      return new MockRequest(this.app, path, query);

    }

    test() {}

  }

  return Test;

})();
