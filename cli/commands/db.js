"use strict";

module.exports = function(Command) {
  let interfaceDBCommands = require('../../interface/db/commands');
  
  class DBCommand extends Command {
    constructor(name, options, fn, def) {
      super(name, options, fn, def, 'db');
    }
  }
  
  new DBCommand("upgrade", { hidden: true }, (args, flags, callback) => {
    interfaceDBCommands.upgrade(callback);
  }, "");
  
  new DBCommand("create", null, (args, flags, callback) => {
    interfaceDBCommands.create(callback);
  }, "Create a new PostgreSQL database for the current project");
  
  new DBCommand("drop", { hidden: true }, (args, flags, callback) => {
    interfaceDBCommands.drop(callback);
  }, "");
  
  new DBCommand("prepare", null, (args, flags, callback) => {
    interfaceDBCommands.prepare(callback);
  }, "Prepare the PostgreSQL database");
  
  new DBCommand("migrate", null, (args, flags, callback) => {
    interfaceDBCommands.migrate(callback);
  }, "Run all pending Database migrations");
  
  new DBCommand("rollback", null, (args, flags, callback) => {
    interfaceDBCommands.rollback(callback);
  }, "Rollback migrations");
  
  new DBCommand("version", { hidden: true }, (args, flags, callback) => {
    interfaceDBCommands.version(callback);
  }, "");
  
  new DBCommand("bootstrap", { hidden: true }, (args, flags, callback) => {
    // Bootstrap is broken
    return callback(new Error("Bootstrap is broken."));
    // interfaceDBCommands.bootstrap(callback);
  }, "Runs db:prepare and db:migrate in a single command");
};