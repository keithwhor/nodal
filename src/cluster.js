module.exports = (() => {

  'use strict';

  const Nodal = require('nodal');
  const cluster = require('cluster');

  if (cluster.isMaster) {

    const daemon = Nodal.require('app/daemon.js');
    daemon.start(Nodal.my.Config.secrets.PORT);

  } else {

    new Nodal.Application(Nodal.my.Config.secrets.PORT);

  }

})();
