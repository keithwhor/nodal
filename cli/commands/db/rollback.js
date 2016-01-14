module.exports = (() => {

  'use strict';

  const DatabaseCommand = require('../../database_command.js');

  return new DatabaseCommand(
    'rollback',
    {definition: 'Rollback migrations'},
    (args, flags, callback) => {

      const bootstrapper = require('../../../core/my/bootstrapper.js');
      bootstrapper.rollback(flags.step, callback);

    }
  );

})();
