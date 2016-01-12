module.exports = (() => {

  'use strict';

  const Command = require('../command.js');

  let interfaceCommands = require('../interface/generate/new.js');

  return new Command(
    null,
    'new',
    {definition: 'Initialize the current directory as a new Nodal project', order: 1},
    (args, flags, callback) => interfaceCommands.new(args, flags, callback)
  );

})();
