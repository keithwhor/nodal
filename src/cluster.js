module.exports = (() => {

  'use strict';

  const cluster = require('cluster');

  const Nodal = require('nodal');

  if (cluster.isMaster) {

    new Nodal.Daemon(process.env.PORT);

  } else {

    new Nodal.Application(process.env.PORT);

  }

})();
