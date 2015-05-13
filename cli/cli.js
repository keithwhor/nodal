#!/usr/bin/env node

"use strict";

(function() {

  let colors = require('colors/safe');
  let fs = require('fs');

  let command = process.argv.slice(2, 3).pop();

  command = command ? command : '_';
  command = {name: command.split(':')[0], value: command.split(':')[1] || '_'};

  if (command.name !== 'new' && !fs.existsSync(process.cwd() + '/.nodal')) {

    console.error(colors.red.bold('Error: ') + 'Nodal project not initialized. Use `nodal new` to initialize a project.');
    process.exit(0);

  } else if (command.name === 'new') {

    (function() {

      let ncp = require('ncp');

      ncp(__dirname + '/../src', './', function (err) {

        if (err) {
          console.error(err);
          process.exit(0);
          return
        }

        console.log('Please enter your password to give Nodal permission to install')

        let spawn = require('child_process').spawn;
        let child = spawn('sudo',  ['npm', 'install']);

        console.log('Installing packages in this directory...');

        child.on('exit', function() {
          console.log('Created new Nodal project!');
          process.exit(0);
        });

        process.on('exit', function() {
          child && child.kill();
        });

      });

    })();

    return;

  }

  let dbCommands = require('./db/commands.js');
  let generateCommands = require('./generate/commands.js');

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

  let commands = {
    _: {
      _: function(args, flags) {
        console.error(colors.red.bold('Error: ') + 'No command specified');
        process.exit(0);
      }
    },
    s: {
      _: function(args, flags) {

        let Nodal = require('../core/module.js');

        let spawn = require('child_process').spawn;
        let child = spawn('npm',  ['start'], {stdio: [process.stdin, process.stdout, process.stderr]});

        process.on('exit', function() {
          child && child.kill();
        });

      }
    },
    db: {
      _: function(args, flags) {
        console.log('Please specify an action');
      },
      create: dbCommands.create,
      drop: dbCommands.drop,
      prepare: dbCommands.prepare,
      migrate: dbCommands.migrate,
      rollback: dbCommands.rollback
    },
    g: {
      _: function(args, flags) {
        console.log('Please specify an action');
      },
      model: generateCommands.model,
      migration: generateCommands.migration,
      controller: generateCommands.controller
    }
  };

  let cmd = commands[command.name];
  let subCmd;

  if (cmd) {
    subCmd = cmd[command.value];
    if (subCmd) {
      subCmd(args, flags);
    } else {
      console.error(colors.red.bold('Error: ') + 'Sub command "' + command.value + '" of "' + command.name + '" not found');
      process.exit(0);
    }
  } else {
    console.error(colors.red.bold('Error: ') + 'Command "' + command.name + '" not found');
    process.exit(0);
  }

})();
