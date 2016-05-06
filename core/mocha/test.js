module.exports = (() => {

  'use strict';

  const EndpointRequest = require('./endpoint_request.js');

  /**
  *  Parent class for mocah test integration
  *
  *
  * @class
  *
  */

  class Test {

    constructor(testRunner) {

      this.testRunner = testRunner;
      Object.defineProperty(this, 'router', {get: () => this.testRunner.router});

    }

    /**
    * Wrapper for testing
    * @param {function} verb The testing method that should be used in the test block.
    */

    __test__(verb) {

      describe(this.constructor.name, () => {

        this.before && before(this.before.bind(this, verb));

        this.test(verb);

        this.after && after(this.after.bind(this, verb));

      });

    }

    /**
    * Intended to be overwritten when inherited.
    * @param {function} verb Expects a testing verb i.e. `expect` to user in the defined test
    */

    test() {}

    /**
    * Creates a new MockRequest object (emulates an HTTP request)
    * @param {string} path The path you wish to hit
    * @param {Object} query The query parameters you wish to pass
    * @return {Nodal.EndpointRequest}
    */
    endpoint(path, query) {

      return new EndpointRequest(this.router, path, query);

    }

  }

  return Test;

})();
