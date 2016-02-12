#!/usr/bin/env node

(() => {

  'use strict';

  const colors = require('colors/safe');
  const fs = require('fs');
  const path = require('path');

  const CommandManager = require('./command_manager.js');
  const Command = require('./command.js');

  const commandManager = new CommandManager();

  let command = process.argv.slice(2, 3).pop();

  command = command ? command : '';

  // Make sure we are in a project directory
  if ((command !== 'new') && (command !== 'help') && (!fs.existsSync(process.cwd() + '/.nodal'))) {
    console.error(colors.red.bold('Error: ') + 'No Nodal project found here. Use `nodal new` to initialize a project.');
    console.error(colors.green('Help: ') + 'Type `nodal help` to get more information about what Nodal can do for you.');
    process.exit(1);
  }

  let args = [];
  let flags = {};

  // Parse arguments & flags from argv
  process.argv.slice(3).forEach(function(v) {
    let values = v.split(':');
    if (v.substr(0, 2) === '--') {
      values[0] = values[0].substr(2);
      flags[values[0]] = values[1];
    } else {
      args.push(values);
    }
  });

  if (flags.env) {
    process.env.NODE_ENV = flags.env;
  }

  // Internally implemented commands (require access to Set) //
  // Define `nodal help` command
  commandManager.add(
    new Command(
      null,
      'help',
      {definition: 'Help and information on all Nodal CLI commands'},
      (args, flags, callback) => {

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
        commandManager.map.forEach((command) => {
          if(command.full().length > highPad) highPad = command.full().length;
          // Start at 1 to skip above
          for(let i = 1; i < command.extLength(); i++) {
            let extLength = command.ext(i).split('#')[0].length + command.full().split(' ')[0].length;
            if((command.ext(i).length > highPad) && extLength > highPad) highPad = extLength;
          }
        });

        // Sort Command map
        let commandsList = [];
        // We use commandsList to store all the keys
        for(var key of commandManager.map.keys()) { commandsList.push(key); }
        // Sort the keys based on Class options
        commandsList.sort((a, b) => {
          return commandManager.map.get(a)._order - commandManager.map.get(b)._order;
        });

        // Go through the sorted keys
        commandsList.forEach((key) => {
          // Get the actual class
          let command = commandManager.map.get(key);
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
      }
    )
  );

  let addCommand = dir => {

    return filename => {

      if (!path.extname(filename)) {

        if (filename !== '.' && filename !== '..') {
          let nextDir = path.resolve(dir, filename);
          return fs.readdirSync(nextDir).forEach(addCommand(nextDir));
        }

        return;

      }

      commandManager.add(require(path.resolve(dir, filename)));

    }

  };

  let commandDir = path.resolve(__dirname, 'commands');
  fs.readdirSync(commandDir).forEach(addCommand(commandDir));

  // Check if our constructed Map has the command
  if (!commandManager.map.has(command)) {

    console.error(colors.red.bold('Error: ') + 'Command "' + command + '" not found');
    console.log(colors.green('Help: ') + 'Type `nodal help` to get more information about what Nodal can do for you.');
    process.exit(1);

  }

  commandManager.map.get(command).exec(args, flags, (error) => {

    if (error) {

      if (typeof error === 'string') {
        console.error(colors.red.bold('Error: ') + error);
      } else {
        console.error(colors.red.bold('Error: ') + error.message);
        error.details && console.error(error.details);
        error.stack && console.error(error.stack);
      }
      
      // Append help to all errors
      console.log(colors.green('Help: ') + 'Type `nodal help` to get more information about what Nodal can do for you.');
    }

    process.exit(error ? 1 : 0);

  });

})();
