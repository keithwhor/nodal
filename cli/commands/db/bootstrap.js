module.exports = (() => {

  'use strict';

  const DatabaseCommand = require('../../database_command.js');

  const bootstrapper = require('../../../core/my/bootstrapper.js');

  return new DatabaseCommand(
    'bootstrap',
    {definition: 'Runs db:create, db:prepare, db:migrate, db:seed'},
    (args, flags, callback) => {

      bootstrapper.bootstrap(callback);

    }
  );

})();
