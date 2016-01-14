module.exports = (() => {

  'use strict';

  const DatabaseCommand = require('../../database_command.js');

  const bootstrapper = require('../../../core/my/bootstrapper.js');

  return new DatabaseCommand(
    'rollback',
    {definition: 'Rollback migrations'},
    (args, flags, callback) => {

      bootstrapper.rollback(flags.step, callback);

    }
  );

})();
