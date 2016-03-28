module.exports = (() => {

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

    run(args, flags, vflags, callback) {

      const bootstrapper = require('../../../core/my/bootstrapper.js');
      bootstrapper.migrate(vflags.step, callback);

    }

  }

  return DBMigrateCommand;

})();
