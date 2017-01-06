'use strict';

const EndpointRequest = require('./endpoint_request.js');

class Test {

  constructor(testRunner) {

    this._data = {};
    this.testRunner = testRunner;
    Object.defineProperty(this, 'router', {get: () => this.testRunner.router});

  }

  __test__(verb) {

    describe(this.constructor.name, () => {

      this.before && before(done => this.before(done));
      this.after && after(done => this.after(done));

      this.test(verb);

    });

  }

  set(key, value) {
    return this._data[key] = value;
  }

  unset(key) {
    delete this._data[key];
  }

  get(key, defaultValue) {
    return this._data.hasOwnProperty(key) ? this._data[key] : defaultValue;
  }

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

module.exports = Test;
