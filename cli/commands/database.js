"use strict";

module.exports = function(Command) {
  let interfaceDBCommands = require('../../interface/db/commands');

  class DBCommand extends Command {
    constructor(name, options, fn, def) {
      super(name, options, fn, def, 'db');
    }
  }

  new DBCommand("upgrade", { hidden: true }, (args, flags, callback) => {
    interfaceDBCommands.upgrade(args, flags, callback);
  }, "");

  new DBCommand("create", null, (args, flags, callback) => {
    interfaceDBCommands.create(args, flags, callback);
  }, "Create a new PostgreSQL database for the current project");

  new DBCommand("drop", { hidden: true }, (args, flags, callback) => {
    interfaceDBCommands.drop(args, flags, callback);
  }, "");

  new DBCommand("prepare", null, (args, flags, callback) => {
    interfaceDBCommands.prepare(args, flags, callback);
  }, "Prepare the PostgreSQL database");

  new DBCommand("migrate", null, (args, flags, callback) => {
    interfaceDBCommands.migrate(args, flags, callback);
  }, "Run all pending Database migrations");

  new DBCommand("rollback", null, (args, flags, callback) => {
    interfaceDBCommands.rollback(args, flags, callback);
  }, "Rollback migrations");

  new DBCommand("version", { hidden: true }, (args, flags, callback) => {
    interfaceDBCommands.version(args, flags, callback);
  }, "");

  new DBCommand("seed", null, (args, flags, callback) => {
    interfaceDBCommands.seed(args, flags, callback);
  }, "Populate database with default data");

};
