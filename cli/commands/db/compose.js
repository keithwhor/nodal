'use strict';

const Command = require('cmnd').Command;

class DBBootstrapCommand extends Command {

  constructor() {

    super('db', 'compose');

  }

  help() {

    return {
      description: 'Runs db:prepare, db:migrate, db:seed',
    };

  }

  run(params, callback) {

    const bootstrapper = require('../../../core/my/bootstrapper.js');
    bootstrapper.compose(callback);

  }

}

module.exports = DBBootstrapCommand;
