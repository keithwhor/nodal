module.exports = (() => {

  'use strict';

  const DatabaseCommand = require('../../database_command.js');

  return new DatabaseCommand(
    'bootstrap',
    {definition: 'Runs db:create, db:prepare, db:migrate, db:seed'},
    (args, flags, callback) => {

      const bootstrapper = require('../../../core/my/bootstrapper.js');
      bootstrapper.bootstrap(callback);

    }
  );

})();
