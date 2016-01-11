'use strict';

module.exports = function(Command) {
  let interfaceCommands = require('../../interface/generate/new');

  new Command("new", {}, (args, flags, callback) => {
    interfaceCommands.new(args, flags, callback);
  }, "Initialize the current directory as a new Nodal project");
};
