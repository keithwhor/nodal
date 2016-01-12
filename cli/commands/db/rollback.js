module.exports = (() => {

  'use strict';

  const DatabaseCommand = require('../../database_command.js');
  const interfaceDBCommands = require('../../interface/db/commands.js');

  return new DatabaseCommand(
    'rollback',
    {definition: 'Rollback migrations'},
    (args, flags, callback) => interfaceDBCommands.rollback(args, flags, callback)
  );

})();
