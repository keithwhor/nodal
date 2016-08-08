'use strict';

const Command = require('cmnd').Command;

class DBVersionCommand extends Command {

  constructor() {

    super('db', 'version');

  }

  help() {

    return {
      description: 'Gets the current schema version from the database'
    };

  }

  run(params, callback) {

    const bootstrapper = require('../../../core/my/bootstrapper.js');
    bootstrapper.version(callback);

  }

}

module.exports = DBVersionCommand;
