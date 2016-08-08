'use strict';

const Command = require('cmnd').Command;

class DBPrepareCommand extends Command {

  constructor() {

    super('db', 'prepare');

  }

  help() {

    return {
      description: 'Prepares your database for migrations (resets all data)'
    };

  }

  run(params, callback) {

    const bootstrapper = require('../../../core/my/bootstrapper.js');
    bootstrapper.prepare(callback);

  }

}

module.exports = DBPrepareCommand;
