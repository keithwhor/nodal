#!/usr/bin/env node

"use strict";

(function() {

  const colors = require('colors/safe');
  const fs = require('fs');
  const prompt = require('prompt');
  const inflect = require('i')();

  prompt.message = '';
  prompt.delimiter = '';

  let command = process.argv.slice(2, 3).pop();

  command = command ? command : '_';
  command = {name: command.split(':')[0], value: command.split(':')[1] || '_'};

  let commandDefinitions = {
      "new": "Initialize the current directory as a new Nodal project",
      "s": "Start the Nodal server based on the current project",
      "db:create": "Create a new PostgreSQL database for the current project",
      "db:prepare": "Prepare the PostgreSQL database",
      "g:model --<user>": "Add a new model",
      "g:model --<access_token>": "Add a new model through access token",
      "g:model <path_to_model>": "Add a new model from a path",
      "g:controller <path_to_controller>": "Add a new controller",
      "g:controller <path_to> --for:<modelname>": "Add a new controller for a model",
      "g:middleware <path_to_middleware>": "Add a new middleware",
      "g:task <task name>": "Add a new task",
      "db:migrate": "Run all pending Database migrations",
      "db:rollback": "Rollback migrations",
      "db:bootstrap": "Runs db:prepare and db:migrate in a single command"
  };

  function repeatChar(char, r) {
    // Repeats a character to create a string
    // Useful for logging
    var str = '';
    for (var i = 0; i < Math.ceil(r); i++) str += char;
    return str;
  }

  // Check for `nodal help` command
  if (command.name === 'help') {

    console.log('');
    console.log(' Nodal commands');
    console.log('');

    let highPad = 0;
    // Find the longest length
    for (var keys in commandDefinitions) { if(keys.length > highPad) highPad = keys.length; }
    for (var cKey in commandDefinitions) {
      // Extract base command (e.g. `g:model`)
      let fullCommand = cKey;
      let padding = '';
      // Add padding to the end
      if(fullCommand.length < highPad) padding = repeatChar(' ', highPad - fullCommand.length);

      // Parse Command to colorize
      let splitCommand = fullCommand.split(' ');
      let baseCommand = splitCommand.shift();
      let tags = splitCommand.join(' ');
      let definition = commandDefinitions[cKey];

      console.log(colors.yellow.bold(' nodal ' + baseCommand), (tags)?colors.gray(tags):'', padding, '\t' + definition);
      console.log(colors.gray(repeatChar('-', highPad + 7)));
    }
    process.exit(1);

  }

  if (command.name !== 'new' && !fs.existsSync(process.cwd() + '/.nodal')) {

    console.error(colors.red.bold('Error: ') + 'No Nodal project found here. Use `nodal new` to initialize a project.');
    console.error(colors.green('Help: ') + 'Type `nodal help` to get more information about what Nodal can do for you.');
    process.exit(1);

  } else if (command.name === 'new') {

    (function() {

      let fs_extra = require('fs-extra');

      console.log('');
      console.log('Welcome to Nodal!');
      console.log('');
      console.log('Let\'s get some information about your project...');
      console.log('');

      var schema = {
        properties: {
          name: {
            default: 'my-nodal-project'
          },
          author: {
            default: 'mysterious author'
          },
          heroku: {
            message: 'heroku support?',
            validator: /y[es]*|n[o]?/,
            warning: 'Must respond yes or no',
            default: 'no',
            before: (value) => value === 'yes'
          }
        }
      };

      prompt.get(schema, function (err, promptResult) {

        if (err) {
          process.exit(1);
        }

        promptResult.simpleName = promptResult.name.replace(/\s/gi, '-');
        promptResult.databaseName = inflect.underscore(promptResult.name);
        let dirname = promptResult.name.replace(/[^A-Za-z0-9-_]/gi, '-').toLowerCase();

        console.log('');
        console.log('Creating directory "' + dirname + '"...');
        console.log('');

        if (fs.existsSync('./' + dirname)) {
          console.log(colors.bold.red('Directory "' + dirname + '" already exists, try a different project name'));
          process.exit(1);
        }
        fs.mkdirSync('./' + dirname);

        console.log('Copying Nodal directory structure and files...');
        console.log('');

        fs_extra.copy(__dirname + '/../src', './' + dirname, function (err) {

          if (err) {
            console.error(err);
            process.exit(0);
            return
          }

          let dot = require('dot');

          dot.templateSettings.strip = false;
          dot.templateSettings.varname = 'data';

          fs.writeFileSync('./' + dirname + '/package.json', dot.template(
            fs.readFileSync(__dirname + '/package.json.jst').toString()
          )(promptResult));

          if (promptResult.heroku) {
            fs.writeFileSync('./' + dirname + '/app.json', dot.template(
              fs.readFileSync(__dirname + '/app.json.jst').toString()
            )(promptResult));
          }

          fs.writeFileSync('./' + dirname + '/app/controllers/index_controller.js', dot.template(
            fs.readFileSync(__dirname + '/index_controller.jst').toString()
          )(promptResult));

          fs.writeFileSync('./' + dirname + '/README.md', dot.template(
            fs.readFileSync(__dirname + '/README.md.jst').toString()
          )(promptResult));

          // read in the dbjson template, replace the development database name
          // generate new config/db.json in the generated app
          let dbjson = JSON.parse(fs.readFileSync(__dirname + '/templates/db.json'));
          dbjson.development.main.database = promptResult.databaseName + '_development';
          fs.writeFileSync('./' + dirname + '/config/db.json', JSON.stringify(dbjson, null, 4));

          let spawn = require('cross-spawn-async');

          let child = spawn('npm', ['cache', 'clean'], {cwd: process.cwd() + '/' + dirname, stdio: 'inherit'});

          child.on('exit', function() {

            let child = spawn('npm',  ['install'], {cwd: process.cwd() + '/' + dirname, stdio: 'inherit'});

            console.log('Installing packages in this directory...');
            console.log('');

            child.on('exit', function() {
              console.log('');
              console.log(colors.bold.green('All done!'));
              console.log('');
              console.log('Your new Nodal project, ' + colors.bold(promptResult.name) + ', is ready to go! :)');
              console.log('');
              console.log('Have fun ' + promptResult.author + ', and check out https://github.com/keithwhor/nodal for the most up-to-date Nodal information')
              console.log('');
              console.log(colors.bold('Pro tip: ') + 'You can try running your server right away with:');
              console.log('');
              console.log('  cd ' + dirname + ' && nodal s');
              console.log('');
              process.exit(0);
            });

            process.on('exit', function() {
              child && child.kill();
            });

          });

        });

      });

    })();

    return;

  }

  let dbCommands = require('./db/commands.js');
  let generateCommands = require('./generate/commands.js');

  // bind the db funcs so that they can call each other
  Object.keys(dbCommands).forEach((f) => {
    dbCommands[f] = dbCommands[f].bind(dbCommands);
  });

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
        let spawn = require('cross-spawn-async');
        let child = spawn('npm',  ['start'], {stdio: 'inherit'});

        process.on('exit', function() {
          child && child.kill();
        });

      }
    },
    db: {
      _: function(args, flags) {
        console.log('Please specify an action');
      },
      upgrade: dbCommands.upgrade,
      create: dbCommands.create,
      drop: dbCommands.drop,
      prepare: dbCommands.prepare,
      migrate: dbCommands.migrate,
      rollback: dbCommands.rollback,
      version: dbCommands.version,
      bootstrap: dbCommands.bootstrap
    },
    g: {
      _: function(args, flags) {
        console.log('Please specify an action');
      },
      model: generateCommands.model,
      migration: generateCommands.migration,
      controller: generateCommands.controller,
      initializer: generateCommands.initializer,
      middleware: generateCommands.middleware,
      task: generateCommands.task
    },
    task: {
      _: function(args, flags) {

        let taskName = args[0] && args[0][0] || '';
        let cwd = process.cwd();
        let taskPath = cwd + '/tasks/' + taskName + '.js';

        if (!fs.existsSync(taskPath)) {
          console.log('Task "' + taskName + '" does not exist');
          process.exit(1);
        }

        const Daemon = new require('../core/required/daemon.js');
        let daemon = new Daemon('./app/app.js');

        daemon.start(function(app) {

          const Task = require(taskPath);
          let task = new Task();

          task.exec(app, function(err) {

            if (err) {
              console.log('Error executing task: ' + err.message);
            } else {
              console.log('Task complete!');
            }

            process.exit(0);

          });

        });

      }
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
      process.exit(1);
    }
  } else {
    console.error(colors.red.bold('Error: ') + 'Command "' + command.name + '" not found');
    process.exit(1);
  }

})();
