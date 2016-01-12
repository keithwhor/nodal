module.exports = (() => {

  'use strict';

  const GenerateCommand = require('../../generate_command.js');
  const interfaceGenerateCommands = require('../../interface/generate/commands.js');

  return new GenerateCommand(
    'middleware <path_to_middleware>',
    {definition: 'Add a new middleware'},
    (args, flags, callback) => interfaceGenerateCommands.middleware(args, flags, callback)
  );

})();
