module.exports = (() => {

  'use strict';

  const httpMocks = require('node-mocks-http');
  const qs = require('querystring');

  class MockRequest {

    constructor(app, path, params) {

      this.app = app;
      this._path = path + (params ? `?${qs.stringify(params)}` : '');

    }

    mock(method, body, callback) {

      let mockData = {
        method: method,
        path: this._path,
        headers: {}
      };

      if (body) {
        if (typeof body === 'object' && body !== null) {
          mockData.headers['Content-Type'] = mockData.headers['Content-Type'] || 'application/json; charset=utf-8';
          mockData.body = JSON.stringify(body);
        } else if (body instanceof Buffer) {
          mockData.headers['Content-Type'] = mockData.headers['Content-Type'] || 'application/octet-steam';
          mockData.body = body;
        } else {
          mockData.headers['Content-Type'] = 'x-www-form-urlencoded';
          mockData.body = body;
        }
      }

      let request = httpMocks.createRequest(mockData);
      let response = httpMocks.createResponse();

      this.app.router.delegate(this.app, request, response);

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

  return MockRequest;

})();
