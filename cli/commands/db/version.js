module.exports = (() => {

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

    run(args, flags, vflags, callback) {

      const bootstrapper = require('../../../core/my/bootstrapper.js');
      bootstrapper.version(callback);

    }

  }

  return DBVersionCommand;

})();
