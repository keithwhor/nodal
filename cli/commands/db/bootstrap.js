module.exports = (() => {

  'use strict';

  const DatabaseCommand = require('../../database_command.js');
  const interfaceDBCommands = require('../../interface/db/commands.js');

  return new DatabaseCommand(
    'bootstrap',
    {definition: 'Run db:prepare, db:migrate and db:seed with one command'},
    (args, flags, callback) => interfaceDBCommands.bootstrap(args, flags, callback)
  );

})();
