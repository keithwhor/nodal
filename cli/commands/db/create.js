

'use strict';

const Command = require('cmnd').Command;

class DBCreateCommand extends Command {

  constructor() {

    super('db', 'create');

  }

  help() {

    return {
      description: 'Create a new PostgreSQL database for the current project'
    };

  }

  run(args, flags, vflags, callback) {

    if (vflags.env) {
      process.env.NODE_ENV = vflags.env[0];
    }

    const bootstrapper = require('../../../core/my/bootstrapper.js');
    bootstrapper.create(callback);

  }

}

module.exports = DBCreateCommand;
