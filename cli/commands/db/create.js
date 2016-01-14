module.exports = (() => {

  'use strict';

  const DatabaseCommand = require('../../database_command.js');

  return new DatabaseCommand(
    'create',
    {definition: 'Create a new PostgreSQL database for the current project'},
    (args, flags, callback) => {

      const bootstrapper = require('../../../core/my/bootstrapper.js');
      bootstrapper.create(callback);

    }
  );

})();
