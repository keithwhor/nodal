module.exports = (() => {

  'use strict';

  const DatabaseCommand = require('../../database_command.js');

  return new DatabaseCommand(
    'prepare',
    {definition: 'Prepare the PostgreSQL database'},
    (args, flags, callback) => {

      const bootstrapper = require('../../../core/my/bootstrapper.js');
      bootstrapper.prepare(callback);

    }
  );

})();
