

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

  run(params, callback) {

    if (params.vflags.env) {
      process.env.NODE_ENV = params.vflags.env[0];
    }

    const bootstrapper = require('../../../core/my/bootstrapper.js');
    bootstrapper.create(callback);

  }

}

module.exports = DBCreateCommand;
