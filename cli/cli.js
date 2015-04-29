#!/usr/bin/env node

(function() {

  var colors = require('colors/safe');
  var fs = require('fs');

  var command = process.argv.slice(2, 3).pop();

  command = command ? command : '_';
  command = {name: command.split(':')[0], value: command.split(':')[1] || '_'};

  if (command.name !== 'new' && !fs.existsSync(process.cwd() + '/.nodal')) {

    console.error(colors.red.bold('Error: ') + 'Nodal project not initialized. Use `nodal new` to initialize a project.');
    process.exit(0);

  } else if (command.name === 'new') {

    (function() {

      var ncp = require('ncp');

      ncp(__dirname + '/../src', './', function (err) {
        if (err) {
          return console.error(err);
        }
        console.log('Created new nodal project!');
        process.exit(0);
      });

    })();

    return;

  }

  var dbCommands = require('./db/commands.js');
  var generateCommands = require('./generate/commands.js');

  var args = [];
  var flags = {};

  process.argv.slice(3).forEach(function(v) {
    var values = v.split(':');
    if (v.substr(0, 2) === '--') {
      values[0] = values[0].substr(2);
      flags[values[0]] = values[1];
    } else {
      args.push(values);
    }
  });

  var commands = {
    _: {
      _: function(args, flags) {
        console.error(colors.red.bold('Error: ') + 'No command specified');
        process.exit(0);
      }
    },
    s: {
      _: function(args, flags) {

        var Nodal = require('../core/module.js');
        var watch = require('watch');

        var restart = false;

        var spawn = require('child_process').spawn;
        var child = spawn('npm',  ['start'], {stdio: [process.stdin, process.stdout, process.stderr]});

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

  var cmd = commands[command.name];
  var subCmd;

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
