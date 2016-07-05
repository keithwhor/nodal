'use strict';

const Command = require('cmnd').Command;
const async = require('async');

const PolyCreateCommand = require('./create.js');
const PolyDBCreateCommand = require('./db/create.js');
const PolyDBAssignCommand = require('./db/assign.js');
const PolyCompileCommand = require('./compile.js');

class PolyNewCommand extends Command {

  constructor() {

    super('poly', 'new');

  }

  help() {

    return {
      description: 'Creates a new API project with associated database',
      args: ['projectName']
    };

  }

  run(args, flags, vflags, callback) {

    let name = args[0];

    // for PolyCompileCommand
    vflags.prepare = true;

    async.series([
      cb => PolyCreateCommand.prototype.run([name], flags, vflags, cb),
      cb => PolyDBCreateCommand.prototype.run([name], flags, vflags, cb),
      cb => PolyDBAssignCommand.prototype.run([name, name], flags, vflags, cb),
      cb => PolyCompileCommand.prototype.run([name], flags, vflags, cb)
    ], (err) => {

      if (err) {
        return callback(err);
      }

      console.log('Project created successfully!');

    });

  }

}

module.exports = PolyNewCommand;
