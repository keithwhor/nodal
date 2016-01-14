module.exports = (() => {

  'use strict';

  const mocks = require('mocks');
  const qs = require('querystring');
  const path = require('path');

  class EndpointRequest {

    constructor(app, path, params) {

      this.app = app;
      this._path = path + (params ? `?${qs.stringify(params)}` : '');

    }

    mock(method, body, callback) {

      let request = new mocks.http.ServerRequest();
      let response = new mocks.http.ServerResponse();

      request.setHeader = (header, value) => request.headers[header] = value;
      request.url = path.resolve('localhost', this._path);
      request.method = method;
      request.connection = {
        destroy: () => {},
        remoteAddress: '::1'
      };

      if (typeof body === 'object' && body !== null) {
        request.setHeader('Content-Type', request.getHeader('Content-Type') || 'application/json; charset=utf-8');
        mockData.body = JSON.stringify(body);
      } else if (body instanceof Buffer) {
        request.setHeader('Content-Type', request.getHeader('Content-Type') || 'application/octet-steam');
        mockData.body = body;
      } else if (body) {
        request.setHeader('Content-Type', 'x-www-form-urlencoded');
      }

      this.app.router.delegate(this.app, request, response);

      body && request.emit('data', body);
      response.on('end', () => {

        let json = null;
        try {
          json = JSON.parse(response._body);
        } catch (e) {
          json = null;
        }

        callback(response._status, response._headers, response._body, json);

      });

      setTimeout(() => request.emit('end'), 1);

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
