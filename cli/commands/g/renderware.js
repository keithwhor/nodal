module.exports = (() => {

  'use strict';

  const GenerateCommand = require('../../generate_command.js');
  const interfaceGenerateCommands = require('../../interface/generate/commands.js');

  return new GenerateCommand(
    'renderware <path_to_renderware>',
    {definition: 'Add a new renderware'},
    (args, flags, callback) => interfaceGenerateCommands.renderware(args, flags, callback)
  );

})();
