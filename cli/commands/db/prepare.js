module.exports = (() => {

  'use strict';

  const DatabaseCommand = require('../../database_command.js');
  const interfaceDBCommands = require('../../interface/db/commands.js');

  return new DatabaseCommand(
    'prepare',
    {definition: 'Prepare the PostgreSQL database'},
    (args, flags, callback) => interfaceDBCommands.prepare(args, flags, callback)
  );

})();
