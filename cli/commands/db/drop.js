module.exports = (() => {

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

      const bootstrapper = require('../../../core/my/bootstrapper.js');
      bootstrapper.drop(callback);

    }

  }

  return DBDropCommand;

})();
