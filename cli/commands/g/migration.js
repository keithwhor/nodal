module.exports = (() => {

  'use strict';

  const GenerateCommand = require('../../generate_command.js');
  const interfaceGenerateCommands = require('../../interface/generate/commands.js');

  return new GenerateCommand(
    'migration',
    {definition: 'Generate an empty migration'},
    (args, flags, callback) => interfaceGenerateCommands.migration(args, flags, callback)
  );

})();
