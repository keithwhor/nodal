'use strict';

const Command = require('cmnd').Command;

class DBMigrateCommand extends Command {

  constructor() {

    super('db', 'migrate');

  }

  help() {

    return {
      description: 'An example command',
      vflags: {
        step: 'The number of steps to migrate (default: all)'
      }
    };

  }

  run(params, callback) {

    const bootstrapper = require('../../../core/my/bootstrapper.js');
    bootstrapper.migrate(params.vflags.step, callback);

  }

}

module.exports = DBMigrateCommand;
