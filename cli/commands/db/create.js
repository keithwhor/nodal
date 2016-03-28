module.exports = (() => {

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

      const bootstrapper = require('../../../core/my/bootstrapper.js');
      bootstrapper.create(callback);

    }

  }

  return DBCreateCommand;

})();
