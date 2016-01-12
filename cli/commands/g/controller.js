module.exports = (() => {

  'use strict';

  const GenerateCommand = require('../../generate_command.js');
  const interfaceGenerateCommands = require('../../interface/generate/commands.js');

  return new GenerateCommand(
    'controller <path_to_controller>',
    {
      definition: 'Add a new controller',
      ext: [
        '<path_to> --for:<modelname> #Add a new controller for a model'
      ]
    },
    (args, flags, callback) => interfaceGenerateCommands.controller(args, flags, callback)
  );

})();
