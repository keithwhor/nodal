module.exports = (() => {

  'use strict';

  const DatabaseCommand = require('../../database_command.js');
  const interfaceDBCommands = require('../../interface/db/commands.js');

  return new DatabaseCommand(
    'seed',
    {definition: 'Populate database with default data'},
    (args, flags, callback) => {
      interfaceDBCommands.seed(args, flags, callback);
    }
  );

})();
