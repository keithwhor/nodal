#!/usr/bin/env node

"use strict";

(function() {
  const colors = require('colors/safe');
  const fs = require('fs');
  const path = require('path');

  let command = process.argv.slice(2, 3).pop();

  command = command ? command : '_base_';
  
  // Make sure we are in a project directory
  if ((command !== 'new') && (command !== 'help') && (!fs.existsSync(process.cwd() + '/.nodal'))) {
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
    constructor(cmd, options, fn, def, prefix) {
      this._cmd = cmd;
      this._name = cmd.split(' ')[0];
      this._prefix = prefix;
      this._options = options || {};
      this._ext = (this._options.ext || []);
      this._ext.unshift(cmd.split(' ').splice(1).join(' '));
      this._def = def;
      this._fn = fn;
      commandMap.set(this.index(), this);
    }
    
    index() {
      return ((this._prefix)?(this._prefix + ':'):'') + this._name;
    }
    
    full() {
      return ((this._prefix)?(this._prefix + ':'):'') + this._cmd;
    }
    
    ext(n) {
      return this._ext[n || 0];
    }
    
    extLength() {
      return this._ext.length;
    }
    
    isHidden() {
      return (this._options.hidden === true);
    }
    
    getDefinition() {
      return this._def;
    }

    exec(args, flags, callback) {
      if(typeof this._fn !== 'function') return callback(new Error("Method not implemented yet."));
      this._fn(args, flags, callback);
    }
  }
  
  /**
   * @todo Implement order of Commands for display purposes
   * @todo Order requires a sort implement a sort or use v8's Array#Sort
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
    // Find the longest length (deep search to include ext)
    commandMap.forEach((command) => {
      if(command.full().length > highPad) highPad = command.full().length;
      // Start at 1 to skip above
      for(let i = 1; i < command.extLength(); i++) {
        if(command.ext(i).length > highPad) highPad = command.ext(i).split('#')[0].length + command.full().split(' ')[0].length;
      }
    });
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

      // SubCommand we start at 1 to skip the original (printed above)
      for(let i = 1; i < command.extLength(); i++) {
        let localDef = command.ext(i).split('#');
        let localCommand = localDef.shift();
        let localPad = repeatChar(' ', (highPad - baseCommand.length - localCommand.length));
        console.log(colors.yellow.bold(' nodal ' + baseCommand.toLowerCase()), colors.gray(localCommand.toLowerCase()), localPad, '\t' + localDef.join(''));
      }
      
      // Line under
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
