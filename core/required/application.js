module.exports = (() => {

  'use strict';

  const fxn = require('fxn');
  const API = require('./api.js');

  /**
  * Singleton Parent Application class
  *
  * Handles server process exceptions, sets process message event listeners, creates server, sets router and handles server process shutdown.
  *
  * @class
  *
  */

  class Application extends fxn.Application {

    constructor() {

      super('Nodal');

    }

    /**
    * HTTP Error Handler
    * @param {http.ClientRequest} req Client request object
    * @param {http.ServerResponse} res Server response object
    * @param {integer} start ?
    * @param {integer} status Status code for response
    * @param {string} message Error message to be logged
    * @param {object} err Error object used to generate error stack
    */
    error(req, res, start, status, message, err) {

      status = status || 500;
      message = message || 'Internal Server Error';

      let headers = {'Content-Type': 'application/json'};

      err && console.log(err.stack);

      this.send(
        req,
        res,
        start,
        status,
        headers,
        JSON.stringify(
          API.error(
            message,
            (process.env.NODE_ENV !== 'production' && err) ?
              err.stack.split('\n') : null
          ),
          null,
          2
        ),
        message
      );

    }

  }

  return Application;

})();
