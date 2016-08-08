'use strict';

const Command = require('cmnd').Command;

class DBBootstrapCommand extends Command {

  constructor() {

    super('db', 'bootstrap');

  }

  help() {

    return {
      description: 'Runs db:drop, db:create, db:prepare, db:migrate, db:seed',
    };

  }

  run(params, callback) {

    const bootstrapper = require('../../../core/my/bootstrapper.js');
    bootstrapper.bootstrap(callback);

  }

}

module.exports = DBBootstrapCommand;
