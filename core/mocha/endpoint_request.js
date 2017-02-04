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

  mock(method, body, headers, callback) {

    return this.router.dispatch(
      this.router.prepare(
        '::1',
        this.url,
        method,
        Object.keys(headers || {}).reduce(function(a, c){ headers[c.toLowerCase()] = headers[c]; return headers;},{}),
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

    this.mock('GET', null, null, callback);

  }

  del(callback) {

    this.mock('DELETE', null, null, callback);

  }

  post(body, callback) {

    this.mock('POST', body, {'Content-Type': 'application/json'}, callback);

  }

  postHead(body, headers, callback){

    this.mock('POST', body, headers, callback);

  }

  put(body, callback) {

    this.mock('PUT', body, {'Content-Type': 'application/json'}, callback);

  }

  putHead(body, headers, callback) {

    this.mock('PUT', body, headers, callback);

  }

}

module.exports = EndpointRequest;
