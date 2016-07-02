'use strict';

const Command = require('cmnd').Command;

class DBDropCommand extends Command {

  constructor() {

    super('db', 'drop');

  }

  help() {

    return {
      description: 'drops the currently active database'
    };

  }

  run(args, flags, vflags, callback) {

    if (vflags.env) {
      process.env.NODE_ENV = vflags.env[0];
    }

    const bootstrapper = require('../../../core/my/bootstrapper.js');
    bootstrapper.drop(callback);

  }

}

module.exports = DBDropCommand;
