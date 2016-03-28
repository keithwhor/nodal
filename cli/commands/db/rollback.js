module.exports = (() => {

  'use strict';

  const Command = require('cmnd').Command;

  class DBRollbackCommand extends Command {

    constructor() {

      super('db', 'rollback');

    }

    help() {

      return {
        description: 'Rollback completed migrations',
        vflags: {
          step: 'Number of steps to rollback (default: 1)'
        }
      };

    }

    run(args, flags, vflags, callback) {

      const bootstrapper = require('../../../core/my/bootstrapper.js');
      bootstrapper.rollback(vflags.step, callback);

    }

  }

  return DBRollbackCommand;

})();
