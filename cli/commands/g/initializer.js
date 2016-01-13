module.exports = (() => {

  'use strict';

  const GenerateCommand = require('../../generate_command.js');
  const interfaceGenerateCommands = require('../../interface/generate/commands.js');

  return new GenerateCommand(
    'initializer',
    {definition: 'Generate a new initializer'},
    (args, flags, callback) => interfaceGenerateCommands.initializer(args, flags, callback)
  );

})();
