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

  error(req, res, err) {

    res.writeHead(500, {'Content-Type': 'text/plain'});

    res.end(
      JSON.stringify(
        API.error(
          'Application Error',
          (process.env.NODE_ENV !== 'production' && err) ?
            err.stack.split('\n') : null
          ),
        null,
        2
      )
    );

  }

}

module.exports = Daemon;
