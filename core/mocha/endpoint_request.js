module.exports = (() => {

  'use strict';

  const qs = require('querystring');

  /**
  *  Endpoint Request
  *
  *  Implements mocked request handlers for endpoint testing
  *
  *
  * @class
  *
  */

  class EndpointRequest {

    constructor(router, path, params) {

      this.router = router;
      this.url = path + (params ? `?${qs.stringify(params)}` : '');
      this.route = this.router.find(this.url);

      if (!this.route) {
        throw new Error(`Route for ${this._path} does not exist`);
      }

    }

    /**
    * Generates a mocked GET request in testing, with a default mocked GET response.
    * @param {String} method Request type to be mocked
    * @param {String} body Body data to be mocked
    * @param {Function} callback Callback to be invoked on mock request. `callback(status, headers, body, json)`
    */
    mock(method, body, callback) {

      return this.router.dispatch(
        this.router.prepare(
          '::1',
          this.url,
          method,
          {},
          body
        ),
        (err, status, headers, body) => {

          let json = null;

          if (err) {
            status = 500;
            body = new Buffer(0);
          } else {

            try {
              json = JSON.parse(body.toString());
            } catch (e) {
              json = null;
            }

          }

          callback(status, headers, body, json);

        }
      );

    }

    /**
    * Method called when a route is hit with a GET request in testing, with a default mocked GET response.
    * @param {function} callback Callback to be invoked on mock request. `callback(status, headers, body, json)`
    */

    get(callback) {

      this.mock('GET', null, callback);

    }

    /**
    * Method called when a route is hit with a GET request in testing, with a default mocked GET response.
    * @param {function} callback Callback to be invoked on mock request. `callback(status, headers, body, json)`
    */

    del(callback) {

      this.mock('DELETE', null, callback);

    }

    /**
    * Method called when a route is hit with a GET request in testing, with a default mocked GET response.
    * @param {function} callback Callback to be invoked on mock request. `callback(status, headers, body, json)`
    */

    post(body, callback) {

      this.mock('POST', body, callback);

    }

    /**
    * Method called when a route is hit with a PUT request in testing, with a default mocked PUT response.
    * @param {function} callback Callback to be invoked on mock request. `callback(status, headers, body, json)`
    */

    put(body, callback) {

      this.mock('PUT', body, callback);

    }

  }

  return EndpointRequest;

})();
