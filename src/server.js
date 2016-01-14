module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');

  let daemon = new Nodal.Daemon('./app/app.js');

  daemon.start();

})();
