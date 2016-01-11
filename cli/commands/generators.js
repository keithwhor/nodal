"use strict";

module.exports = function(Command) {
  let interfaceDBCommands = require('../../interface/generate/commands');

  class GeneratorCommand extends Command {
    constructor(name, options, fn, def) {
      super(name, options, fn, def, 'g');
      this._order = 20;
    }
  }

  new GeneratorCommand("model <path_to_model>", {
    ext: ["--access_token #Add a new access_token model", "--user #Add a new user model from a built-in generator"]
  }, (args, flags, callback) => {
    interfaceDBCommands.model(args, flags, callback);
  }, "Add a new model");

  new GeneratorCommand("migration", { hidden: true }, (args, flags, callback) => {
    interfaceDBCommands.migration(args, flags, callback);
  }, "");

  new GeneratorCommand("controller <path_to_controller>", {
    ext: ["<path_to> --for:<modelname> #Add a new controller for a model"]
  }, (args, flags, callback) => {
    interfaceDBCommands.controller(args, flags, callback);
  }, "Add a new controller");

  new GeneratorCommand("initializer", { hidden: true }, (args, flags, callback) => {
    interfaceDBCommands.initializer(args, flags, callback);
  }, "");

  new GeneratorCommand("middleware <path_to_middleware>", null, (args, flags, callback) => {
    interfaceDBCommands.middleware(args, flags, callback);
  }, "Add a new middleware");

  new GeneratorCommand("task <task name>", { hidden: false }, (args, flags, callback) => {
    interfaceDBCommands.task(args, flags, callback);
  }, "Add a new task");
};
