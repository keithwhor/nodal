module.exports = (() => {

  'use strict';

  const GenerateCommand = require('../../generate_command.js');
  const interfaceGenerateCommands = require('../../interface/generate/commands.js');

  return new GenerateCommand(
    'task <task name>',
    {definition: 'Add a new task'},
    (args, flags, callback) => interfaceGenerateCommands.task(args, flags, callback)
  );

})();
