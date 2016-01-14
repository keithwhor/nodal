module.exports = (() => {

  'use strict';

  const DatabaseCommand = require('../../database_command.js');

  const bootstrapper = require('../../../core/my/bootstrapper.js');

  return new DatabaseCommand(
    'prepare',
    {definition: 'Prepare the PostgreSQL database'},
    (args, flags, callback) => {

      bootstrapper.prepare(callback);

    }
  );

})();
