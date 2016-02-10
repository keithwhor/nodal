module.exports = (() => {

  'use strict';

  const Nodal = require('nodal');
  const cluster = require('cluster');

  if (cluster.isMaster) {

    const daemon = Nodal.require('app/daemon.js');
    daemon.start(Nodal.my.Config.secrets.port);

  } else {

    const app = new Nodal.Application();
    app.listen(Nodal.my.Config.secrets.port);


  }

})();
