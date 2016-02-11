module.exports = (() => {

  'use strict';

  const Nodal = require('nodal');
  const daemon = new Nodal.Daemon();

  const DummyInitializer = Nodal.require('initializers/dummy_initializer.js');

  daemon.initializers.use(DummyInitializer);

  return daemon;

})();
