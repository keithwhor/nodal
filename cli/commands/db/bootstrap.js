module.exports = (() => {

  'use strict';

  const Command = require('cmnd').Command;

  class DBBootstrapCommand extends Command {

    constructor() {

      super('db', 'bootstrap');

    }

    help() {

      return {
        description: 'Runs db:prepare, db:migrate, db:seed',
      };

    }

    run(args, flags, vflags, callback) {

      const bootstrapper = require('../../../core/my/bootstrapper.js');
      bootstrapper.bootstrap(callback);

    }

  }

  return DBBootstrapCommand;

})();
