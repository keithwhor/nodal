#!/usr/bin/env node

"use strict";

(function() {
  const colors = require('colors/safe');
  const fs = require('fs');
  const path = require('path');

  let command = process.argv.slice(2, 3).pop();

  command = command ? command : '_base_';
  
  // Make sure we are in a project directory
  if (command !== 'new' && !fs.existsSync(process.cwd() + '/.nodal')) {
    console.error(colors.red.bold('Error: ') + 'No Nodal project found here. Use `nodal new` to initialize a project.');
    console.error(colors.green('Help: ') + 'Type `nodal help` to get more information about what Nodal can do for you.');
    process.exit(1);
  }

  /// Improve ///
  let args = [];
  let flags = {};

  process.argv.slice(3).forEach(function(v) {
    let values = v.split(':');
    if (v.substr(0, 2) === '--') {
      values[0] = values[0].substr(2);
      flags[values[0]] = values[1];
    } else {
      args.push(values);
    }
  });
  /// ------ ///
  
  // A Map that stores all commands
  let commandMap = new Map();

  // Command Definition
  class Command {
    constructor(name, options, fn, def, prefix) {
      this._name = name;
      this._prefix = prefix;
      this._options = options || {};
      this._def = def;
      this._fn = fn;
      commandMap.set(this.full(), this);
    }
    
    full() {
      return ((this._prefix)?(this._prefix + ':'):'') + this._name;
    }
    
    isHidden() {
      return (this._options.hidden === true);
    }
    
    getDefinition() {
      return this._def;
    }

    exec(args, flags, callback) {
      this._fn(args, flags, callback);
    }
  }
  
  /**
   * @todo Implement order of Commands for display purposes
   * @todo Order requires a sort implement a sort or use v8's Array#Sort
   * @todo Define _base_ somewhere
   * @todo Implement Command method options such as tags, flags, hidden, etc.
   * @todo Implement nested help (info on tags, flags)
   */
  
  /* Commands to implement
  model: generateCommands.model,
  migration: generateCommands.migration,
  controller: generateCommands.controller,
  initializer: generateCommands.initializer,
  middleware: generateCommands.middleware,
  task: generateCommands.task
  */
  
  /* Definition Leftovers (nom nom nom)
   * Remove as you implement
    "g:model --<user>": "Add a new model",
    "g:model --<access_token>": "Add a new model through access token",
    "g:model <path_to_model>": "Add a new model from a path",
    "g:controller <path_to_controller>": "Add a new controller",
    "g:controller <path_to> --for:<modelname>": "Add a new controller for a model",
    "g:middleware <path_to_middleware>": "Add a new middleware",
    "g:task <task name>": "Add a new task",
  */
  
  // Internally implemented commands (require access to Set) //
  // Define `nodal help` command
  new Command("help", null, (args, flags, callback) => {
    let repeatChar = (char, r) => {
      // Repeats a character to create a string
      // Useful for logging
      var str = '';
      for (var i = 0; i < Math.ceil(r); i++) str += char;
      return str;
    };
    
    console.log('');
    console.log(' Nodal commands');
    console.log('');

    let highPad = 0;
    // Find the longest length
    commandMap.forEach((command) => { if(command.full().length > highPad) highPad = command.full().length; });
    commandMap.forEach((command) => {
      // If command is hidden continue (return in case of forEach)
      if(command.isHidden()) return;
      // Extract base command (e.g. `g:model`)
      let fullCommand = command.full();
      let padding = '';
      // Add padding to the end
      if(fullCommand.length < highPad) padding = repeatChar(' ', highPad - fullCommand.length);

      // Parse Command to colorize
      let splitCommand = fullCommand.split(' ');
      let baseCommand = splitCommand.shift();
      let tags = splitCommand.join(' ');
      let definition = command.getDefinition();

      console.log(colors.yellow.bold(' nodal ' + baseCommand.toLowerCase()), (tags)?colors.gray(tags):'', padding, '\t' + definition);
      console.log(colors.gray(repeatChar('-', highPad + 7)));
    });
    
    callback();
  }, "Help and information on all Nodal CLI commands");
  
  // Recursive Importer
  let commandDir = path.resolve(__dirname, 'commands');
  let commandFiles = fs.readdirSync(commandDir);

  for(let i = 0; i < commandFiles.length; i++) {
    /**
     * @todo Add check for stats here (just to double check it exists)
     * @todo Add check if file ext is .js
    */
    // Require command file & pass Command class to it
    require(path.resolve(commandDir, commandFiles[i]))(Command);
  }
  
  // Check if our constructed Map has the command
  if(commandMap.has(command)) {
    commandMap.get(command).exec(args, flags, function(error) {
      if(error) {
        console.error(colors.red.bold('Error: ') + error.message);
        // Append help to all errors
        console.log(colors.green('Help: ') + 'Type `nodal help` to get more information about what Nodal can do for you.');
      }
      process.exit((error)?1:0);
    });
  }else{
    console.error(colors.red.bold('Error: ') + 'Command "' + command + '" not found');
    console.log(colors.green('Help: ') + 'Type `nodal help` to get more information about what Nodal can do for you.');
  }
})();
