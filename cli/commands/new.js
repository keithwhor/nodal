module.exports = function(Command) {
  'use strict';

  let interfaceCommands = require('../interface/generate/new');

  new Command("new", { order: 1 }, (args, flags, callback) => {
    interfaceCommands.new(args, flags, callback);
  }, "Initialize the current directory as a new Nodal project");
};
