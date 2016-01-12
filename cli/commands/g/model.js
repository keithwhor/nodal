module.exports = (() => {

  'use strict';

  const GenerateCommand = require('../../generate_command.js');
  const interfaceGenerateCommands = require('../../interface/generate/commands.js');

  return new GenerateCommand(
    'model <path_to_model>',
    {
      definition: 'Add a new model',
      ext: [
        '--access_token #Add a new access_token model',
        '--user #Add a new user model from a built-in generator'
      ]
    },
    (args, flags, callback) => interfaceGenerateCommands.model(args, flags, callback)
  );

})();
