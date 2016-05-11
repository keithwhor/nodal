module.exports = (() => {

  'use strict';

  const fxn = require('fxn');

  const API = require('./api.js');

  /**
  * Multi-process HTTP Daemon that resets when files changed (in development)
  * @class
  */
  class Daemon extends fxn.Daemon {

    constructor() {

      super('Nodal');

    }

    /**
    * Error method for handling Daemon errors
    *
    * @param {object} request Request to which to respond with an error
    * @param {object} response Response object to which the error message will be attached
    * @param {object} error Error object to add to the response
    */

    error(req, res, error) {

      res.writeHead(500, {'Content-Type': 'text/plain'});

      res.end(
        JSON.stringify(
          API.error(
            message,
            (process.env.NODE_ENV !== 'production' && err) ?
              err.stack.split('\n') : null
            ),
          null,
          2
        )
      );

    }

  }

  return Daemon;

})();
