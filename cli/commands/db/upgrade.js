module.exports = (() => {

  'use strict';

  const DatabaseCommand = require('../../database_command.js');
  const interfaceDBCommands = require('../../interface/db/commands.js');

  return new DatabaseCommand(
    'upgrade',
    {hidden: true},
    (args, flags, callback) => interfaceDBCommands.upgrade(args, flags, callback)
  );

})();
