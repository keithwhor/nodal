'use strict';

const Nodal = require('nodal');

class AuthController extends Nodal.Controller {

  authorize(callback) {

    this.setHeader('Cache-Control', 'no-store');
    this.setHeader('Pragma', 'no-cache');

    callback(null);

  }

}

module.exports = AuthController;
