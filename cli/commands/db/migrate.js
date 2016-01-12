module.exports = (() => {

  'use strict';

  const DatabaseCommand = require('../../database_command.js');
  const interfaceDBCommands = require('../../interface/db/commands.js');

  return new DatabaseCommand(
    'migrate',
    {definition: 'Run all pending Database migrations'},
    (args, flags, callback) => interfaceDBCommands.migrate(args, flags, callback)
  );

})();
