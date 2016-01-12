module.exports = (() => {

  'use strict';

  const DatabaseCommand = require('../../database_command.js');
  const interfaceDBCommands = require('../../interface/db/commands.js');

  return new DatabaseCommand(
    'drop',
    {hidden: true},
    (args, flags, callback) => interfaceDBCommands.drop(args, flags, callback)
  );

})();
