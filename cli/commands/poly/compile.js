'use strict';

const Command = require('cmnd').Command;
const async = require('async');
const colors = require('colors/safe');

const PolyDeployCommand = require('./deploy.js');
const PolyRunCommand = require('./run.js');

class PolyCompileCommand extends Command {

  constructor() {

    super('poly', 'compile');

  }

  help() {

    return {
      description: 'Compiles your Nodal API to the cloud, runs database migrations',
      args: ['projectName'],
      vflags: {
        prepare: 'Runs db:prepare after compilation (resets DB)',
        'no-migrate': 'Do not run db:migrate after compilation'
      }
    };

  }

  run(args, flags, vflags, callback) {

    let name = args[0];

    let commands = [
      cb => PolyDeployCommand.prototype.run([name], flags, vflags, cb)
    ];

    vflags.prepare && commands.push(cb => PolyRunCommand.prototype.run([name, 'db:prepare'], flags, vflags, cb));
    vflags['no-migrate'] || commands.push(cb => PolyRunCommand.prototype.run([name, 'db:migrate'], flags, vflags, cb));

    async.series(commands, (err, results) => {

      if (err) {
        return callback(err);
      }

      console.log('');
      console.log(colors.bold.green('Awesome. Compilation Successful!'));
      console.log(`Access your API online at:`)
      console.log(colors.bold(results[0].url));
      console.log();
      callback();

    });

  }

}

module.exports = PolyCompileCommand;
