module.exports = (() => {

  'use strict';

  const qs = require('querystring');

  class EndpointRequest {

    constructor(router, path, params) {

      this.router = router;
      this.url = path + (params ? `?${qs.stringify(params)}` : '');
      this.route = this.router.find(this.url);

      if (!this.route) {
        throw new Error(`Route for ${this._path} does not exist`);
      }

    }

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

    get(callback) {

      this.mock('GET', null, callback);

    }

    del(callback) {

      this.mock('DELETE', null, callback);

    }

    post(body, callback) {

      this.mock('POST', body, callback);

    }

    put(body, callback) {

      this.mock('PUT', body, callback);

    }

  }

  return EndpointRequest;

})();
