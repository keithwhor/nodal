module.exports = (() => {

  'use strict';

  const DatabaseCommand = require('../../database_command.js');

  const bootstrapper = require('../../../core/my/bootstrapper.js');

  return new DatabaseCommand(
    'migrate',
    {definition: 'Run all pending Database migrations'},
    (args, flags, callback) => {

      bootstrapper.migrate(flags.step, callback);

    }
  );

})();
