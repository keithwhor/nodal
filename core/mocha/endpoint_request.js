'use strict';

const qs = require('querystring');

class EndpointRequest {

  constructor(router, path, params) {

    this.router = router;
    this.url = path + (params ? `?${qs.stringify(params)}` : '');
    this.route = this.router.find(this.url);
    this.token = null;

    if (!this.route) {
      throw new Error(`Route for ${this._path} does not exist`);
    }

  }

  auth(token) {

    if (this.token) {
      throw new Error('Authorization token already set');
    }

    this.token = token;
    return this;

  }

  mock(method, headers, body, callback) {

    headers = headers || {};

    if (this.token) {
      headers['authorization'] = `Bearer ${this.token}`;
    }

    if (body instanceof Buffer) {
      // do nothing
    } else if (body && typeof body === 'object') {
      body = new Buffer(JSON.stringify(body));
      headers['content-type'] = 'application/json';
    } else {
      body = new Buffer(body + '');
    }

    return this.router.dispatch(
      this.router.prepare(
        '::1',
        this.url,
        method,
        headers,
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

    this.mock('GET', {}, null, callback);

  }

  del(callback) {

    this.mock('DELETE', {}, null, callback);

  }

  post(body, callback) {

    this.mock('POST', {}, body, callback);

  }

  put(body, callback) {

    this.mock('PUT', {}, body, callback);

  }

}

module.exports = EndpointRequest;
