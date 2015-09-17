module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');

  let daemon = new Nodal.Daemon('./app/worker.js');

  daemon.start(function(app) {

    console.log('Worker ready');

  });

})();
