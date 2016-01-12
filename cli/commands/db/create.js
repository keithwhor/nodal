module.exports = (() => {

  'use strict';

  const DatabaseCommand = require('../../database_command.js');
  const interfaceDBCommands = require('../../interface/db/commands.js');

  return new DatabaseCommand(
    'create',
    {definition: 'Create a new PostgreSQL database for the current project'},
    (args, flags, callback) => interfaceDBCommands.create(args, flags, callback)
  );

})();
